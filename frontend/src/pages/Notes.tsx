import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from "framer-motion"
import { Search, LogOut, Menu, Sparkles, Trash2, Tag, X } from "lucide-react"
import { useAuth } from "../context/AuthContext"
import { useNavigate } from "react-router-dom"
import noteService, { type Note, type CreateNoteRequest } from "../services/noteService"

const noteEmojis = ["📝", "✍️", "📚", "💭", "💡", "🎯", "📌", "🌟", "✨", "📖"]
const defaultCategories = ["Personal 👤", "Work 💼", "Ideas 💭", "Tasks 📋", "Study 📚"]

// Debounce function
const debounce = (func: Function, wait: number) => {
  let timeout: ReturnType<typeof setTimeout>
  return (...args: any[]) => {
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
  const { logout } = useAuth()
  const navigate = useNavigate()

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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const noteVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24,
      },
    },
    hover: {
      y: -5,
      boxShadow: "0 10px 20px rgba(0,0,0,0.1)",
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10,
      },
    },
  }

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
      {isLoading ? (
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="notes-container">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
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
                          onClick={() => handleDeleteNote(note.id)}
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
                                onClick={() => handleRemoveCategory(note.id, category)}
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
                            onClick={() => {
                              const dropdown = document.getElementById(`categories-${note.id}`)
                              if (dropdown) {
                                dropdown.classList.toggle("hidden")
                              }
                            }}
                            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-purple-600"
                          >
                            <Tag className="h-4 w-4" />
                            Add category
                          </motion.button>
                          <div
                            id={`categories-${note.id}`}
                            className="hidden absolute left-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10"
                          >
                            <div className="py-1">
                              {categories
                                .filter((cat) => !note.categories.includes(cat))
                                .map((category) => (
                                  <button
                                    key={category}
                                    onClick={() => {
                                      handleAddCategory(note.id, category)
                                      const dropdown = document.getElementById(`categories-${note.id}`)
                                      if (dropdown) {
                                        dropdown.classList.add("hidden")
                                      }
                                    }}
                                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-purple-50"
                                  >
                                    {category}
                                  </button>
                                ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            </main>

            {/* Note Editor Modal */}
            {showNoteModal && selectedNote && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="fixed inset-0" onClick={() => setShowNoteModal(false)} />
                <div
                  className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden z-10"
                  onClick={(e) => e.stopPropagation()}
                >
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="p-6 flex flex-col h-full">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 flex-1">
                          <span className="text-2xl">{selectedNote.emoji}</span>
                          <input
                            type="text"
                            value={selectedNote.title}
                            onChange={(e) => {
                              const newTitle = e.target.value
                              setSelectedNote({ ...selectedNote, title: newTitle })
                              debounce(() => handleUpdateNoteTitle(selectedNote.id, newTitle), 500)()
                            }}
                            className="text-xl font-semibold w-full border-none focus:ring-2 focus:ring-purple-500 rounded-lg px-2 py-1"
                            placeholder="Untitled Note"
                          />
                        </div>
                        <button onClick={() => setShowNoteModal(false)} className="text-gray-500 hover:text-gray-700">
                          <X className="h-6 w-6" />
                        </button>
                      </div>

                      <textarea
                        value={selectedNote.content}
                        onChange={(e) => {
                          const newContent = e.target.value
                          setSelectedNote({ ...selectedNote, content: newContent })
                          debounce(() => handleUpdateNoteContent(selectedNote.id, newContent), 500)()
                        }}
                        className="flex-1 w-full p-4 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                        placeholder="Start writing your note here..."
                      />

                      <div className="mt-4 flex flex-wrap gap-2">
                        {selectedNote.categories.map((category) => (
                          <span key={category} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                            {category}
                          </span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            )}

            {/* New Note Modal */}
            {(showNewNoteModal || currentNoteId) && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="fixed inset-0" onClick={handleCloseNewNoteModal} />
                <div
                  className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden z-10"
                  onClick={(e) => e.stopPropagation()}
                >
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="p-6 flex flex-col h-full">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 flex-1">
                          <span className="text-2xl">{newNote.emoji}</span>
                          <input
                            type="text"
                            value={newNote.title}
                            onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                            className="text-xl font-semibold w-full border-none focus:ring-2 focus:ring-purple-500 rounded-lg px-2 py-1"
                            placeholder="Untitled Note"
                          />
                        </div>
                        <button onClick={handleCloseNewNoteModal} className="text-gray-500 hover:text-gray-700">
                          <X className="h-6 w-6" />
                        </button>
                      </div>

                      <textarea
                        value={newNote.content}
                        onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                        className="flex-1 w-full p-4 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                        placeholder="Start writing your note here..."
                      />

                      <div className="mt-4 flex flex-wrap gap-2">
                        {newNote.categories.map((category) => (
                          <span key={category} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                            {category}
                          </span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
