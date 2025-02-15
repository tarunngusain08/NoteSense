import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, Variants } from "framer-motion"
import { Search, LogOut, Menu, Sparkles, Trash2, Tag, X, Paperclip, Grid2X2, Kanban } from "lucide-react"
import { useAuth } from "../context/AuthContext"
import { useNavigate } from "react-router-dom"
import noteService, { type Note, type CreateNoteRequest } from "../services/noteService"
import { Toaster, toast } from 'react-hot-toast';
import { 
  DragDropContext, 
  Droppable, 
  Draggable, 
  DropResult 
} from 'react-beautiful-dnd';

const noteEmojis = ["📝", "✍️", "📚", "💭", "💡", "🎯", "📌", "🌟", "✨", "📖"]
const defaultCategories = ["Personal 👤", "Work 💼", "Ideas 💭", "Tasks 📋", "Study 📚"]

// Debounce function
const debounce = <T extends any[]>(func: (...args: T) => void, wait: number) => {
  let timeout: NodeJS.Timeout
  return (...args: T) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export default function Notes() {
  const [notes, setNotes] = useState<Note[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [showCategoryInput, setShowCategoryInput] = useState(false)
  const [newCategory, setNewCategory] = useState("")
  const [categories, setCategories] = useState(defaultCategories)
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [showNewNoteModal, setShowNewNoteModal] = useState(false)
  const [newNote, setNewNote] = useState<CreateNoteRequest>({
    title: "",
    content: "",
    emoji: noteEmojis[0],
    categories: [],
  })
  const [currentNoteId, setCurrentNoteId] = useState<string | null>(null)
  const [autoSaveInterval, setAutoSaveInterval] = useState<NodeJS.Timeout | null>(null)
  const [showCategoryDropdown, setShowCategoryDropdown] = useState<{ [key: string]: boolean }>({});
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const { logout } = useAuth()
  const navigate = useNavigate()

  // Add state for attachments
  const [selectedNoteAttachments, setSelectedNoteAttachments] = useState<File[]>([]);
  const [newNoteAttachments, setNewNoteAttachments] = useState<File[]>([]);

  // File input ref for both modals
  const fileInputRef = useRef<HTMLInputElement>(null);
  const newNoteFileInputRef = useRef<HTMLInputElement>(null);

  // New Kanban-specific state
  const [viewMode, setViewMode] = useState<'grid' | 'kanban'>('grid');
  const [kanbanNotes, setKanbanNotes] = useState<{
    backlog: Note[];
    todo: Note[];
    in_progress: Note[];
    done: Note[];
  }>({
    backlog: [],
    todo: [],
    in_progress: [],
    done: []
  });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const dropdownTriggers = document.querySelectorAll('[data-category-dropdown-trigger]');
      const dropdowns = document.querySelectorAll('[data-category-dropdown]');
      
      // Check if click is outside ALL dropdowns and their triggers
      const isOutsideAllDropdowns = 
        Array.from(dropdowns).every(dropdown => !dropdown.contains(target)) &&
        Array.from(dropdownTriggers).every(trigger => !trigger.contains(target));

      if (isOutsideAllDropdowns) {
        setShowCategoryDropdown({});
      }
    }

    // Bind the event listener
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      // Unbind the event listener on clean up
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        categoryDropdownRef.current && 
        !categoryDropdownRef.current.contains(event.target as Node)
      ) {
        setShowCategoryDropdown(prevState => ({
          ...prevState,
          [Object.keys(prevState)[0]]: false
        }));
      }
    }

    // Bind the event listener
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      // Unbind the event listener on clean up
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showCategoryDropdown]);

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        setIsLoading(true)
        const userId = localStorage.getItem("userId")
        if (!userId) {
          navigate("/login")
          return
        }
        const fetchedNotes = await noteService.getUserNotes()
        console.log("Fetched notes:", fetchedNotes) // Debug log
        if (Array.isArray(fetchedNotes)) {
          setNotes(fetchedNotes)
        } else {
          console.error("Unexpected notes data format:", fetchedNotes)
          setNotes([])
        }
      } catch (error) {
        console.error("Error fetching notes:", error)
        setNotes([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchNotes()
  }, [navigate])

  const handleCreateNewNote = async () => {
    try {
      // Create a new note with initial empty content
      const createdNote = await noteService.createNote({
        title: "Untitled Note",
        content: "",
        emoji: noteEmojis[Math.floor(Math.random() * noteEmojis.length)],
        categories: [],
      })

      // Refetch all notes to ensure the new note is visible
      const fetchedNotes = await noteService.getUserNotes()
      setNotes(fetchedNotes)

      // Set the current note ID and open the modal
      setCurrentNoteId(createdNote.id)
      setNewNote({
        title: createdNote.title,
        content: createdNote.content,
        emoji: createdNote.emoji,
        categories: createdNote.categories,
      })
      setShowNewNoteModal(true)

      // Set up periodic auto-save
      const interval = setInterval(async () => {
        if (createdNote.id) {
          try {
            await noteService.updateNote(createdNote.id, {
              title: newNote.title,
              content: newNote.content,
              categories: newNote.categories,
            })
          } catch (error) {
            console.error("Auto-save failed:", error)
          }
        }
      }, 3000) // Every 3 seconds

      setAutoSaveInterval(interval)
    } catch (error) {
      console.error("Failed to create note:", error)
    }
  }

  const handleCloseNewNoteModal = async () => {
    // Clear the auto-save interval
    if (autoSaveInterval) {
      clearInterval(autoSaveInterval)
      setAutoSaveInterval(null)
    }

    // Fetch the latest note data and add to notes list
    if (currentNoteId) {
      try {
        const updatedNote = await noteService.getNoteById(currentNoteId)
        setNotes((prevNotes) => [updatedNote, ...prevNotes])
      } catch (error) {
        console.error("Failed to fetch updated note:", error)
      }
    }

    // Reset states
    setShowNewNoteModal(false)
    setCurrentNoteId(null)
    setNewNote({
      title: "",
      content: "",
      emoji: noteEmojis[0],
      categories: [],
    })
  }

  const handleDeleteNote = async (id: string) => {
    try {
      const noteElement = document.getElementById(`note-${id}`)
      if (noteElement) {
        noteElement.style.transform = "scale(0.8)"
        noteElement.style.opacity = "0"
      }
      await noteService.deleteNote(id)
      setTimeout(() => {
        setNotes(notes.filter((note) => note.id !== id))
      }, 300)
    } catch (error) {
      console.error("Error deleting note:", error)
    }
  }

  const handleAddCategory = async (noteId: string, category: string) => {
    try {
      const note = notes.find((n) => n.id === noteId)
      if (note && !note.categories.includes(category)) {
        const updatedCategories = [...note.categories, category]
        const updatedNote = await noteService.updateNote(noteId, { categories: updatedCategories })
        setNotes(notes.map((n) => (n.id === noteId ? updatedNote : n)))
      }
    } catch (error) {
      console.error("Error adding category:", error)
    }
  }

  const handleRemoveCategory = async (noteId: string, category: string) => {
    try {
      const note = notes.find((n) => n.id === noteId)
      if (note) {
        const updatedCategories = note.categories.filter((c) => c !== category)
        const updatedNote = await noteService.updateNote(noteId, { categories: updatedCategories })
        setNotes(notes.map((n) => (n.id === noteId ? updatedNote : n)))
      }
    } catch (error) {
      console.error("Error removing category:", error)
    }
  }

  const handleAddNewCategory = () => {
    if (newCategory && !categories.includes(newCategory)) {
      setCategories([...categories, newCategory])
      setNewCategory("")
      setShowCategoryInput(false)
    }
  }

  useEffect(() => {
    const searchNotes = async () => {
      try {
        if (searchQuery.trim()) {
          const searchResults = await noteService.searchNotes(searchQuery)
          console.log("Search results:", searchResults) // Debug log
          if (Array.isArray(searchResults)) {
            setNotes(searchResults)
          } else {
            console.error("Unexpected search results format:", searchResults)
            setNotes([])
          }
        } else {
          const userId = localStorage.getItem("userId")
          if (userId) {
            const allNotes = await noteService.getUserNotes()
            console.log("All notes:", allNotes) // Debug log
            if (Array.isArray(allNotes)) {
              setNotes(allNotes)
            } else {
              console.error("Unexpected notes data format:", allNotes)
              setNotes([])
            }
          }
        }
      } catch (error) {
        console.error("Error searching notes:", error)
        setNotes([])
      }
    }

    const debounceTimeout = setTimeout(searchNotes, 300)
    return () => clearTimeout(debounceTimeout)
  }, [searchQuery])

  const filteredNotes = notes.filter((note) => {
    return selectedCategories.length === 0 || selectedCategories.some((cat) => note.categories.includes(cat))
  })

  const handleLogout = () => {
    const container = document.querySelector(".notes-container")
    container?.classList.add("slide-out")
    setTimeout(() => {
      logout()
      navigate("/login")
    }, 500)
  }

  const pageVariants: Variants = {
    initial: { 
      opacity: 0, 
      x: '-100vw',
      scale: 0.8 
    },
    in: { 
      opacity: 1, 
      x: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        type: 'spring',
        stiffness: 80,
        damping: 15
      }
    },
    out: { 
      opacity: 0, 
      x: '100vw',
      scale: 1.2,
      transition: {
        duration: 0.6
      }
    }
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.2,
        staggerChildren: 0.1
      }
    }
  };

  const noteVariants: Variants = {
    hidden: { 
      y: 50, 
      opacity: 0,
      rotate: -5
    },
    visible: { 
      y: 0, 
      opacity: 1,
      rotate: 0,
      transition: {
        type: 'spring',
        stiffness: 120,
        damping: 10
      }
    },
    hover: {
      scale: 1.05,
      rotate: 0,
      boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
      transition: { duration: 0.3 }
    },
    tap: {
      scale: 0.95,
      transition: { duration: 0.2 }
    }
  };

  const modalVariants: Variants = {
    hidden: {
      opacity: 0,
      scale: 0.8,
      y: 50
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 15
      }
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      y: 50,
      transition: {
        duration: 0.3
      }
    }
  };

  const fabVariants: Variants = {
    initial: { 
      scale: 0, 
      rotate: -180 
    },
    animate: {
      scale: 1,
      rotate: 0,
      transition: {
        type: 'spring',
        stiffness: 260,
        damping: 20
      }
    },
    hover: {
      scale: 1.1,
      rotate: 90,
      transition: { duration: 0.3 }
    }
  };

  const handleNoteClick = (note: Note) => {
    setSelectedNote(note);
    setShowNoteModal(true);
  };

  const closeNoteModal = () => {
    setShowNoteModal(false);
    setSelectedNote(null);
  };

  // Enhanced Note Detail Modal Variants
  const noteDetailModalVariants: Variants = {
    hidden: {
      opacity: 0,
      scale: 0.6,
      rotateX: -30,
      y: 50,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 20
      }
    },
    visible: {
      opacity: 1,
      scale: 1,
      rotateX: 0,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 250,
        damping: 15,
        delay: 0.1
      }
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      rotateX: 20,
      y: 50,
      transition: {
        duration: 0.3,
        type: 'tween'
      }
    }
  };

  // Background overlay variants
  const overlayVariants: Variants = {
    hidden: {
      opacity: 0,
      backgroundColor: 'rgba(0,0,0,0)'
    },
    visible: {
      opacity: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      transition: {
        duration: 0.3
      }
    }
  };

  // Content reveal variants
  const contentVariants: Variants = {
    hidden: {
      opacity: 0,
      x: -50
    },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        type: 'spring',
        stiffness: 200,
        damping: 10,
        delay: 0.2
      }
    }
  };

  // Emoji and title animation variants
  const headerVariants: Variants = {
    hidden: {
      opacity: 0,
      scale: 0.8,
      rotate: -10
    },
    visible: {
      opacity: 1,
      scale: 1,
      rotate: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 15
      }
    }
  };

  // Kanban Card Variants for Framer Motion
  const kanbanCardVariants: Variants = {
    initial: { 
      opacity: 0, 
      scale: 0.95,
      y: 20,
      rotateX: -10
    },
    animate: { 
      opacity: 1, 
      scale: 1,
      y: 0,
      rotateX: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 20
      }
    },
    hover: {
      scale: 1.03,
      boxShadow: '0 12px 28px rgba(0, 0, 0, 0.08)',
      rotateX: 2,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 10
      }
    },
    tap: {
      scale: 0.97,
      transition: { 
        type: 'spring',
        stiffness: 400,
        damping: 15
      }
    }
  };

  // Text Hover Variants for additional interaction
  const textHoverVariants: Variants = {
    initial: { 
      scale: 1, 
      opacity: 0.8 
    },
    hover: { 
      scale: 1.02, 
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 10
      }
    }
  };

  // Kanban Column Variants
  const kanbanColumnVariants: Variants = {
    initial: { opacity: 0, x: -50 },
    animate: (index) => ({
      opacity: 1, 
      x: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 20,
        delay: index * 0.1
      }
    })
  };

  const handleFileSelect = (isNewNote: boolean) => {
    const fileInput = isNewNote ? newNoteFileInputRef : fileInputRef;
    if (fileInput.current) {
      fileInput.current.click();
    }
  };

  // File change handler
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, isNewNote: boolean) => {
    const files = event.target.files;
    if (files) {
      const fileList = Array.from(files);
      if (isNewNote) {
        setNewNoteAttachments(prev => [...prev, ...fileList]);
      } else {
        setSelectedNoteAttachments(prev => [...prev, ...fileList]);
      }
    }
  };

  // Remove file
  const removeFile = (index: number, isNewNote: boolean) => {
    if (isNewNote) {
      setNewNoteAttachments(prev => prev.filter((_, i) => i !== index));
    } else {
      setSelectedNoteAttachments(prev => prev.filter((_, i) => i !== index));
    }
  };

  const fetchKanbanNotes = async () => {
    try {
      setIsLoading(true);
      const kanbanNotes = await noteService.getKanbanNotes();
      setKanbanNotes(kanbanNotes);
    } catch (error) {
      console.error('Error fetching Kanban notes:', error);
      toast.error('Failed to load notes. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleViewMode = () => {
    const newViewMode = viewMode === 'grid' ? 'kanban' : 'grid';
    setViewMode(newViewMode);

    // Fetch Kanban notes when switching to Kanban view
    if (newViewMode === 'kanban') {
      fetchKanbanNotes();
    }
  };

  useEffect(() => {
    if (viewMode === 'kanban') {
      fetchKanbanNotes();
    }
  }, [viewMode]);

  // Enhanced Drag and Drop Animations
  const getDragStyle = (isDragging: boolean, draggableStyle: any) => ({
    ...draggableStyle,
    userSelect: 'none',
    margin: '0 0 8px 0',
    transition: 'all 0.2s ease-in-out',
    transform: isDragging 
      ? `${draggableStyle.transform} rotate(3deg) scale(1.03)` 
      : draggableStyle.transform,
    boxShadow: isDragging 
      ? '0 15px 30px rgba(0, 0, 0, 0.1)' 
      : '0 4px 6px rgba(0, 0, 0, 0.05)',
    background: isDragging 
      ? 'linear-gradient(135deg, #f6f8f9 0%, #e5ebee 100%)' 
      : 'white'
  });

  // Drag and Drop Column Animations
  const columnVariants: Variants = {
    hidden: { opacity: 0, x: -50 },
    visible: (index) => ({
      opacity: 1, 
      x: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 20,
        delay: index * 0.1
      }
    })
  };

  // Drag Placeholder Animation
  const placeholderVariants: Variants = {
    initial: { 
      opacity: 0, 
      scale: 0.9,
      y: 20 
    },
    animate: { 
      opacity: 1, 
      scale: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 15
      }
    }
  };

  // Enhanced onDragEnd with more sophisticated handling
  const onDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;

    // If dropped outside a droppable or in the same position, do nothing
    if (!destination) return;
    
    // Prevent dragging if not in Kanban view
    if (viewMode !== 'kanban') return;

    // Check if the drop location is different
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) return;

    try {
      // Find the dragged note
      const sourceColumn = source.droppableId as keyof typeof kanbanNotes;
      const destColumn = destination.droppableId as keyof typeof kanbanNotes;
      const draggedNote = kanbanNotes[sourceColumn][source.index];

      // Optimistic UI update
      const newKanbanNotes = { ...kanbanNotes };
      
      // Remove from source column
      newKanbanNotes[sourceColumn] = newKanbanNotes[sourceColumn].filter(
        (_, index) => index !== source.index
      );
      
      // Insert into destination column
      newKanbanNotes[destColumn].splice(destination.index, 0, draggedNote);
      
      setKanbanNotes(newKanbanNotes);

      // Vibration feedback for mobile devices
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }

      // Play subtle sound effect
      const audio = new Audio('/drag-drop-sound.mp3');
      audio.volume = 0.2;
      audio.play().catch(() => {});

      // Update note status on backend
      await noteService.updateNoteStatus(draggedNote.id, destColumn);

      // Success toast
      toast.success(`Moved "${draggedNote.title}" to ${destColumn.replace('_', ' ')}`, {
        icon: '🚀',
        style: {
          borderRadius: '10px',
          background: '#333',
          color: '#fff',
        },
      });
    } catch (error) {
      console.error('Error updating note status:', error);
      toast.error('Failed to move note', {
        style: {
          borderRadius: '10px',
          background: '#ff4b4b',
          color: '#fff',
        },
      });
    }
  };

  const handleNoteCardClick = (note: Note) => {
    setSelectedNote(note);
    setShowNoteModal(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1, rotate: 360 }}
          transition={{ duration: 1, ease: "easeInOut" }}
        >
          <Sparkles className="w-12 h-12 text-purple-600" />
        </motion.div>
      </div>
    )
  }

  const handleUpdateNoteContent = async (noteId: string, content: string) => {
    try {
      const updatedNote = await noteService.updateNote(noteId, { content })
      setNotes((prevNotes) => prevNotes.map((note) => (note.id === noteId ? updatedNote : note)))
    } catch (error) {
      console.error("Error updating note content:", error)
    }
  }

  const handleUpdateNoteTitle = async (noteId: string, title: string) => {
    try {
      const updatedNote = await noteService.updateNote(noteId, { title })
      setNotes((prevNotes) => prevNotes.map((note) => (note.id === noteId ? updatedNote : note)))
    } catch (error) {
      console.error("Error updating note title:", error)
    }
  }

  return (
    <AnimatePresence>
      <Toaster />
      {isLoading ? (
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-blue-500"></div>
        </div>
      ) : (
        <motion.div
          initial="initial"
          animate="in"
          exit="out"
          variants={pageVariants}
          className="notes-container min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50"
        >
          <header className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex items-center justify-between">
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="flex items-center space-x-4"
                >
                  <Menu className="h-6 w-6 text-gray-500" />
                  <h1 className="text-xl font-semibold text-gray-900">✨ My Notes</h1>
                </motion.div>
                <motion.div
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="flex items-center space-x-4"
                >
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="🔍 Search notes..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent bg-white/50 backdrop-blur-sm"
                    />
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05, rotate: 5 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleLogout}
                    className="p-2 text-gray-500 hover:text-gray-700"
                  >
                    <LogOut className="h-5 w-5" />
                  </motion.button>
                </motion.div>
              </div>

              {/* Categories Filter */}
              <div className="mt-4 flex flex-wrap gap-2">
                {categories.map((category) => (
                  <motion.button
                    key={category}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      if (selectedCategories.includes(category)) {
                        setSelectedCategories(selectedCategories.filter((c) => c !== category))
                      } else {
                        setSelectedCategories([...selectedCategories, category])
                      }
                    }}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                      selectedCategories.includes(category)
                        ? "bg-purple-600 text-white"
                        : "bg-white/50 text-gray-600 hover:bg-purple-100"
                    }`}
                  >
                    {category}
                  </motion.button>
                ))}
                {showCategoryInput ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      placeholder="New category..."
                      className="px-3 py-1 rounded-full text-sm border border-purple-300 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          handleAddNewCategory()
                        }
                      }}
                    />
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setShowCategoryInput(false)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <X className="h-4 w-4" />
                    </motion.button>
                  </div>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowCategoryInput(true)}
                    className="px-3 py-1 rounded-full text-sm font-medium bg-white/50 text-gray-600 hover:bg-purple-100"
                  >
                    + Add Category
                  </motion.button>
                )}
              </div>
            </div>
          </header>

          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <motion.button
              onClick={toggleViewMode}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="
                fixed bottom-8 right-8 z-50 
                bg-gradient-to-br from-purple-600 to-indigo-600 
                text-white rounded-full 
                w-16 h-16 flex items-center justify-center 
                shadow-2xl hover:shadow-xl transition-all
                ring-4 ring-white/30
              "
            >
              <AnimatePresence mode="wait">
                {viewMode === 'kanban' ? (
                  <motion.div
                    key="grid"
                    initial={{ rotate: -180, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 180, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  >
                    <Grid2X2 size={28} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="kanban"
                    initial={{ rotate: 180, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -180, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  >
                    <Kanban size={28} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>

            <AnimatePresence mode="wait">
              {viewMode === 'grid' ? (
                <motion.div
                  key="grid-view"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ 
                    type: 'spring', 
                    stiffness: 300, 
                    damping: 20 
                  }}
                >
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  >
                    <motion.button
                      whileHover={{ scale: 1.02, boxShadow: "0 10px 20px rgba(0,0,0,0.1)" }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleCreateNewNote}
                      className="h-48 rounded-lg border-2 border-dashed border-purple-300 bg-white/50 backdrop-blur-sm p-6 flex flex-col items-center justify-center text-purple-500 hover:border-purple-500 hover:text-purple-600 transition-colors"
                    >
                      <motion.div
                        animate={{
                          rotate: [0, 360],
                        }}
                        transition={{
                          duration: 20,
                          repeat: Number.POSITIVE_INFINITY,
                          ease: "linear",
                        }}
                      >
                        <Sparkles className="h-8 w-8 mb-2" />
                      </motion.div>
                      <span className="font-medium">Create new note ✨</span>
                    </motion.button>

                    <AnimatePresence>
                      {filteredNotes.map((note) => (
                        <motion.div
                          key={note.id}
                          id={`note-${note.id}`}
                          layout
                          variants={noteVariants}
                          whileHover="hover"
                          whileTap="tap"
                          onClick={() => {
                            setSelectedNote(note)
                            setShowNoteModal(true)
                          }}
                          className="bg-white/70 backdrop-blur-sm rounded-lg shadow-sm p-6 transform transition-all duration-200 cursor-pointer"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">{note.emoji}</span>
                              <input
                                type="text"
                                value={note.title}
                                onChange={(e) => {
                                  const newTitle = e.target.value
                                  setNotes(notes.map((n) => (n.id === note.id ? { ...n, title: newTitle } : n)))
                                  debounce(() => noteService.updateNote(note.id, { title: newTitle }), 500)()
                                }}
                                className="text-lg font-semibold w-full border-none focus:ring-0 p-0 bg-transparent"
                                placeholder="Untitled Note"
                              />
                            </div>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent note modal from opening
                                handleDeleteNote(note.id)
                              }}
                              className="text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </motion.button>
                          </div>

                          <textarea
                            value={note.content}
                            onChange={(e) => {
                              const newContent = e.target.value
                              setNotes(notes.map((n) => (n.id === note.id ? { ...n, content: newContent } : n)))
                              debounce(() => noteService.updateNote(note.id, { content: newContent }), 500)()
                            }}
                            className="w-full h-32 resize-none border-none focus:ring-0 p-0 bg-transparent"
                            placeholder="Start writing..."
                          />

                          <div className="mt-4">
                            <div className="flex flex-wrap gap-2 mb-2">
                              {note.categories.map((category) => (
                                <motion.span
                                  key={category}
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  exit={{ scale: 0 }}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-purple-100 text-purple-700 text-xs"
                                >
                                  {category}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation(); // Prevent note modal from opening
                                      handleRemoveCategory(note.id, category)
                                    }}
                                    className="hover:text-red-500"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </motion.span>
                              ))}
                            </div>
                            <div className="relative inline-block">
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowCategoryDropdown(prevState => ({
                                    ...prevState,
                                    [note.id]: !prevState[note.id]
                                  }));
                                }}
                                data-category-dropdown-trigger
                                className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-purple-600"
                              >
                                <Tag className="h-4 w-4" />
                                Add category
                              </motion.button>
                              <AnimatePresence>
                                {showCategoryDropdown[note.id] && (
                                  <motion.div
                                    initial={{ opacity: 0, scale: 0.9, y: -10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9, y: -10 }}
                                    transition={{ 
                                      type: "spring", 
                                      stiffness: 300, 
                                      damping: 20 
                                    }}
                                    data-category-dropdown
                                    className="absolute left-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10"
                                    ref={categoryDropdownRef}
                                  >
                                    <div className="py-1">
                                      {categories
                                        .filter((cat) => !note.categories.includes(cat))
                                        .map((category) => (
                                          <motion.button
                                            key={category}
                                            whileHover={{ backgroundColor: "#f3e8ff" }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={(e) => {
                                              e.stopPropagation(); // Prevent note modal from opening
                                              handleAddCategory(note.id, category);
                                              setShowCategoryDropdown(prevState => ({
                                                ...prevState,
                                                [note.id]: false
                                              }));
                                            }}
                                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-purple-50"
                                          >
                                            {category}
                                          </motion.button>
                                        ))}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </motion.div>
                </motion.div>
              ) : (
                <DragDropContext onDragEnd={onDragEnd}>
                  <div className="grid grid-cols-4 gap-4">
                    {Object.entries(kanbanNotes).map(([status, notes], columnIndex) => (
                      <Droppable key={status} droppableId={status}>
                        {(provided) => (
                          <motion.div 
                            variants={columnVariants}
                            initial="initial"
                            animate="animate"
                            custom={columnIndex}
                            {...provided.droppableProps} 
                            ref={provided.innerRef} 
                            className="bg-gray-100 rounded-2xl p-5 shadow-md min-w-[300px] flex-shrink-0"
                          >
                            <h3 className="text-xl font-bold capitalize mb-4 text-gray-700 pl-2">
                              {status.replace('_', ' ')}
                            </h3>
                            {notes.map((note, index) => (
                              <Draggable 
                                key={note.id} 
                                draggableId={note.id} 
                                index={index}
                              >
                                {(provided, snapshot) => (
                                  <motion.div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    style={{
                                      ...provided.draggableProps.style,
                                      // Add additional styling for dragging state
                                      boxShadow: snapshot.isDragging 
                                        ? '0 10px 20px rgba(0,0,0,0.12)' 
                                        : '0 4px 6px rgba(0,0,0,0.1)',
                                      background: snapshot.isDragging 
                                        ? 'linear-gradient(135deg, #f6f8f9 0%, #e5ebee 100%)' 
                                        : 'white'
                                    }}
                                    variants={kanbanCardVariants}
                                    initial="initial"
                                    animate="animate"
                                    whileHover="hover"
                                    whileTap="tap"
                                    onClick={() => handleNoteCardClick(note)}
                                    className="bg-white rounded-xl mb-4 shadow-md"
                                  >
                                    <div 
                                      className="cursor-grab active:cursor-grabbing p-2 border-b border-gray-100 bg-gray-50 rounded-t-xl select-none"
                                    >
                                      <div className="flex justify-between items-center">
                                        <motion.span 
                                          variants={textHoverVariants}
                                          initial="initial"
                                          whileHover="hover"
                                          className="text-lg font-semibold text-gray-800 truncate pr-2"
                                        >
                                          {note.title}
                                        </motion.span>
                                        <motion.span 
                                          variants={textHoverVariants}
                                          initial="initial"
                                          whileHover="hover"
                                          className="text-2xl opacity-70"
                                        >
                                          {note.emoji}
                                        </motion.span>
                                      </div>
                                    </div>
                                    <motion.div
                                      variants={kanbanCardVariants}
                                      initial="initial"
                                      animate="animate"
                                      whileHover="hover"
                                      whileTap="tap"
                                      onClick={() => handleNoteCardClick(note)}
                                      className="p-4 cursor-pointer"
                                    >
                                      <motion.p 
                                        variants={textHoverVariants}
                                        initial="initial"
                                        whileHover="hover"
                                        className="text-sm text-gray-600 line-clamp-3 min-h-[3rem]"
                                      >
                                        {note.content || 'No content'}
                                      </motion.p>
                                      <div className="mt-3 flex justify-between items-center">
                                        <motion.span 
                                          variants={textHoverVariants}
                                          initial="initial"
                                          whileHover="hover"
                                          className="text-xs text-gray-500"
                                        >
                                          {new Date(note.createdAt).toLocaleDateString()}
                                        </motion.span>
                                        <div className="flex space-x-1">
                                          {note.categories.slice(0, 2).map((category, idx) => (
                                            <motion.span 
                                              key={idx}
                                              variants={textHoverVariants}
                                              initial="initial"
                                              whileHover="hover"
                                              className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full"
                                            >
                                              {category}
                                            </motion.span>
                                          ))}
                                        </div>
                                      </div>
                                    </motion.div>
                                  </motion.div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </motion.div>
                        )}
                      </Droppable>
                    ))}
                  </div>
                </DragDropContext>
              )}
            </AnimatePresence>
          </main>

          {/* Enhanced Note Detail Modal */}
          <AnimatePresence>
            {showNoteModal && selectedNote && (
              <motion.div
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={overlayVariants}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden"
                onClick={closeNoteModal}
              >
                <motion.div
                  variants={noteDetailModalVariants}
                  className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden relative"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Note Header */}
                  <motion.div 
                    variants={headerVariants}
                    className="flex items-center p-6 bg-gradient-to-r from-purple-50 to-blue-50"
                  >
                    <motion.span 
                      initial={{ rotate: -180, scale: 0 }}
                      animate={{ rotate: 0, scale: 1 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                      className="text-4xl mr-4"
                    >
                      {selectedNote.emoji}
                    </motion.span>
                    <motion.input
                      variants={contentVariants}
                      value={selectedNote.title}
                      onChange={(e) => {
                        const newTitle = e.target.value;
                        setSelectedNote({ ...selectedNote, title: newTitle });
                        debounce(() => handleUpdateNoteTitle(selectedNote.id, newTitle), 500)();
                      }}
                      className="text-2xl font-bold w-full bg-transparent border-none focus:ring-2 focus:ring-purple-500 rounded-lg"
                      placeholder="Untitled Note"
                    />
                    <motion.button
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={closeNoteModal}
                      className="ml-4 text-gray-500 hover:text-red-500"
                    >
                      <X className="h-6 w-6" />
                    </motion.button>
                  </motion.div>

                  {/* Note Content */}
                  <motion.div 
                    variants={contentVariants}
                    className="p-6"
                  >
                    <motion.textarea
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ 
                        type: 'spring', 
                        stiffness: 200, 
                        delay: 0.3 
                      }}
                      value={selectedNote.content}
                      onChange={(e) => {
                        const newContent = e.target.value;
                        setSelectedNote({ ...selectedNote, content: newContent });
                        debounce(() => handleUpdateNoteContent(selectedNote.id, newContent), 500)();
                      }}
                      className="w-full h-64 resize-none border-none focus:ring-2 focus:ring-purple-500 rounded-lg p-4"
                      placeholder="Start writing your note here..."
                    />
                  </motion.div>

                  {/* Categories */}
                  <motion.div 
                    variants={contentVariants}
                    className="p-6 pt-0 flex flex-wrap gap-2"
                  >
                    {selectedNote.categories.map((category) => (
                      <motion.span
                        key={category}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
                      >
                        {category}
                      </motion.span>
                    ))}
                  </motion.div>

                  {/* File Attachments Section */}
                  <motion.div 
                    variants={contentVariants}
                    className="p-6 pt-0"
                  >
                    <div className="flex items-center gap-2">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleFileSelect(false)}
                        className="text-gray-500 hover:text-purple-600 flex items-center gap-2"
                      >
                        <Paperclip className="h-5 w-5" />
                        Attach File
                      </motion.button>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        multiple 
                        onChange={(e) => handleFileChange(e, false)} 
                      />
                    </div>
                    {selectedNoteAttachments.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {selectedNoteAttachments.map((file, index) => (
                          <div 
                            key={index} 
                            className="flex items-center bg-gray-100 rounded-full px-3 py-1 text-sm"
                          >
                            {file.name}
                            <button 
                              onClick={() => removeFile(index, false)}
                              className="ml-2 text-red-500 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* New Note Modal */}
          <AnimatePresence>
            {(showNewNoteModal || currentNoteId) && (
              <motion.div
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={overlayVariants}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden"
                onClick={handleCloseNewNoteModal}
              >
                <motion.div
                  variants={noteDetailModalVariants}
                  className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden relative"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Note Header */}
                  <motion.div 
                    variants={headerVariants}
                    className="flex items-center p-6 bg-gradient-to-r from-purple-50 to-blue-50"
                  >
                    <motion.span 
                      initial={{ rotate: -180, scale: 0 }}
                      animate={{ rotate: 0, scale: 1 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                      className="text-4xl mr-4"
                    >
                      {newNote.emoji}
                    </motion.span>
                    <motion.input
                      variants={contentVariants}
                      value={newNote.title}
                      onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                      className="text-2xl font-bold w-full bg-transparent border-none focus:ring-2 focus:ring-purple-500 rounded-lg"
                      placeholder="Untitled Note"
                    />
                    <motion.button
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={handleCloseNewNoteModal}
                      className="ml-4 text-gray-500 hover:text-red-500"
                    >
                      <X className="h-6 w-6" />
                    </motion.button>
                  </motion.div>

                  {/* Note Content */}
                  <motion.div 
                    variants={contentVariants}
                    className="p-6"
                  >
                    <motion.textarea
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ 
                        type: 'spring', 
                        stiffness: 200, 
                        delay: 0.3 
                      }}
                      value={newNote.content}
                      onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                      className="w-full h-64 resize-none border-none focus:ring-2 focus:ring-purple-500 rounded-lg p-4"
                      placeholder="Start writing your note here..."
                    />
                  </motion.div>

                  {/* Categories */}
                  <motion.div 
                    variants={contentVariants}
                    className="p-6 pt-0 flex flex-wrap gap-2"
                  >
                    {newNote.categories.map((category) => (
                      <motion.span
                        key={category}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
                      >
                        {category}
                      </motion.span>
                    ))}
                  </motion.div>

                  {/* File Attachments Section */}
                  <motion.div 
                    variants={contentVariants}
                    className="p-6 pt-0"
                  >
                    <div className="flex items-center gap-2">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleFileSelect(true)}
                        className="text-gray-500 hover:text-purple-600 flex items-center gap-2"
                      >
                        <Paperclip className="h-5 w-5" />
                        Attach File
                      </motion.button>
                      <input 
                        type="file" 
                        ref={newNoteFileInputRef} 
                        className="hidden" 
                        multiple 
                        onChange={(e) => handleFileChange(e, true)} 
                      />
                    </div>
                    {newNoteAttachments.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {newNoteAttachments.map((file, index) => (
                          <div 
                            key={index} 
                            className="flex items-center bg-gray-100 rounded-full px-3 py-1 text-sm"
                          >
                            {file.name}
                            <button 
                              onClick={() => removeFile(index, true)}
                              className="ml-2 text-red-500 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
