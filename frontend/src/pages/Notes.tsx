import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, LogOut, Menu, Sparkles, Trash2, Tag, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  emoji: string;
  categories: string[];
}

const noteEmojis = ['📝', '✍️', '📚', '💭', '💡', '🎯', '📌', '🌟', '✨', '📖'];
const defaultCategories = ['Personal 👤', 'Work 💼', 'Ideas 💭', 'Tasks 📋', 'Study 📚'];

export default function Notes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showCategoryInput, setShowCategoryInput] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [categories, setCategories] = useState(defaultCategories);
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const response = await axios.get('http://localhost:8080/notes');
        setNotes(response.data);
      } catch (error) {
        console.error('Error fetching notes:', error);
      }
    };

    fetchNotes();
  }, []);

  const handleCreateNote = async () => {
    const randomEmoji = noteEmojis[Math.floor(Math.random() * noteEmojis.length)];
    const newNote = {
      title: 'Untitled Note',
      content: '',
      emoji: randomEmoji,
      categories: [],
    };

    try {
      const response = await axios.post('http://localhost:8080/notes', newNote);
      setNotes([response.data, ...notes]);
    } catch (error) {
      console.error('Error creating note:', error);
    }
  };

  const handleDeleteNote = (id: string) => {
    const noteElement = document.getElementById(`note-${id}`);
    if (noteElement) {
      noteElement.style.transform = 'scale(0.8)';
      noteElement.style.opacity = '0';
    }
    setTimeout(() => {
      setNotes(notes.filter(note => note.id !== id));
    }, 300);
  };

  const handleAddCategory = (noteId: string, category: string) => {
    setNotes(notes.map(note => {
      if (note.id === noteId && !note.categories.includes(category)) {
        return {
          ...note,
          categories: [...note.categories, category]
        };
      }
      return note;
    }));
  };

  const handleRemoveCategory = (noteId: string, category: string) => {
    setNotes(notes.map(note => {
      if (note.id === noteId) {
        return {
          ...note,
          categories: note.categories.filter(c => c !== category)
        };
      }
      return note;
    }));
  };

  const handleAddNewCategory = () => {
    if (newCategory && !categories.includes(newCategory)) {
      setCategories([...categories, newCategory]);
      setNewCategory('');
      setShowCategoryInput(false);
    }
  };

  const filteredNotes = notes.filter(note => {
    const matchesSearch = 
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategories = 
      selectedCategories.length === 0 ||
      selectedCategories.some(cat => note.categories.includes(cat));

    return matchesSearch && matchesCategories;
  });

  const handleLogout = () => {
    const container = document.querySelector('.notes-container');
    container?.classList.add('slide-out');
    setTimeout(() => {
      logout();
      navigate('/login');
    }, 500);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const noteVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24
      }
    },
    hover: {
      y: -5,
      boxShadow: "0 10px 20px rgba(0,0,0,0.1)",
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10
      }
    }
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
    );
  }

  return (
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
                    setSelectedCategories(selectedCategories.filter(c => c !== category));
                  } else {
                    setSelectedCategories([...selectedCategories, category]);
                  }
                }}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                  selectedCategories.includes(category)
                    ? 'bg-purple-600 text-white'
                    : 'bg-white/50 text-gray-600 hover:bg-purple-100'
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
                    if (e.key === 'Enter') {
                      handleAddNewCategory();
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
            onClick={handleCreateNote}
            className="h-48 rounded-lg border-2 border-dashed border-purple-300 bg-white/50 backdrop-blur-sm p-6 flex flex-col items-center justify-center text-purple-500 hover:border-purple-500 hover:text-purple-600 transition-colors"
          >
            <motion.div
              animate={{
                rotate: [0, 360],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "linear"
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
                className="bg-white/70 backdrop-blur-sm rounded-lg shadow-sm p-6 transform transition-all duration-200"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{note.emoji}</span>
                    <input
                      type="text"
                      value={note.title}
                      onChange={(e) =>
                        setNotes(
                          notes.map((n) =>
                            n.id === note.id ? { ...n, title: e.target.value } : n
                          )
                        )
                      }
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
                  onChange={(e) =>
                    setNotes(
                      notes.map((n) =>
                        n.id === note.id ? { ...n, content: e.target.value } : n
                      )
                    )
                  }
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
                        const dropdown = document.getElementById(`categories-${note.id}`);
                        if (dropdown) {
                          dropdown.classList.toggle('hidden');
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
                        {categories.filter(cat => !note.categories.includes(cat)).map((category) => (
                          <button
                            key={category}
                            onClick={() => {
                              handleAddCategory(note.id, category);
                              const dropdown = document.getElementById(`categories-${note.id}`);
                              if (dropdown) {
                                dropdown.classList.add('hidden');
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
    </motion.div>
  );
}