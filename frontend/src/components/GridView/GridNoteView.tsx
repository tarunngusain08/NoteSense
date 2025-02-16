import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

// Interfaces
interface Note {
  id: string;
  title: string;
  content: string;
  emoji?: string;
  status: string;
  priority: number;
  categories?: string[];
  createdAt: string;
}

// Priority Color Mapping
const getPriorityColor = (priority: number) => {
  switch (priority) {
    case 0: return 'border-gray-200';
    case 1: return 'border-green-200';
    case 2: return 'border-yellow-200';
    case 3: return 'border-red-200';
    default: return 'border-gray-200';
  }
};

const GridNoteView: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Fetch Notes
  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const response = await axios.get('/api/notes');
        setNotes(response.data.notes);
        setFilteredNotes(response.data.notes);
      } catch (error) {
        console.error('Failed to fetch notes', error);
      }
    };

    fetchNotes();
  }, []);

  // Get unique categories
  const categories = Array.from(
    new Set(notes.flatMap(note => note.categories || []))
  );

  // Filter Notes
  useEffect(() => {
    let result = notes;

    if (searchTerm) {
      result = result.filter(note => 
        note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory) {
      result = result.filter(note => 
        note.categories?.includes(selectedCategory)
      );
    }

    setFilteredNotes(result);
  }, [searchTerm, selectedCategory, notes]);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Filters */}
      <div className="mb-8 flex flex-col md:flex-row gap-4">
        {/* Search Input */}
        <input 
          type="text" 
          placeholder="Search notes..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="
            w-full md:w-1/2 px-4 py-2 
            border border-gray-300 rounded-lg 
            focus:outline-none focus:ring-2 focus:ring-purple-500
          "
        />

        {/* Category Filter */}
        <select 
          value={selectedCategory || ''}
          onChange={(e) => setSelectedCategory(e.target.value || null)}
          className="
            w-full md:w-1/2 px-4 py-2 
            border border-gray-300 rounded-lg 
            focus:outline-none focus:ring-2 focus:ring-purple-500
          "
        >
          <option value="">All Categories</option>
          {categories.map(category => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      {/* Notes Grid */}
      <motion.div 
        layout 
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
      >
        <AnimatePresence>
          {filteredNotes.map(note => (
            <motion.div
              key={note.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ 
                type: 'spring', 
                stiffness: 300, 
                damping: 20 
              }}
              className={`
                bg-white rounded-xl shadow-md overflow-hidden 
                border-l-8 ${getPriorityColor(note.priority)}
                hover:shadow-xl transition-all duration-300
              `}
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-gray-800 flex items-center">
                    <span className="mr-2">{note.emoji || '📝'}</span>
                    {note.title}
                  </h3>
                  <span className="text-sm text-gray-500">
                    {new Date(note.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-gray-600 line-clamp-3 mb-4">
                  {note.content}
                </p>
                {note.categories && (
                  <div className="flex flex-wrap gap-2">
                    {note.categories.map(category => (
                      <span 
                        key={category} 
                        className="
                          text-xs px-2 py-1 
                          bg-purple-100 text-purple-800 
                          rounded-full
                        "
                      >
                        {category}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* No Notes Message */}
      {filteredNotes.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-gray-500 mt-16"
        >
          <p className="text-2xl">No notes found 📝</p>
          <p>Try adjusting your search or category filter</p>
        </motion.div>
      )}
    </div>
  );
};

export default GridNoteView;
