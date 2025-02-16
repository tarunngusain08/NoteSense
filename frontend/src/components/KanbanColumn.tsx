import React from 'react';
import { motion } from 'framer-motion';
import { Note } from '../services/noteService';

interface KanbanColumnProps {
  title: string;
  color: string;
  notes: Note[];
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ title, color, notes }) => {
  const columnVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 20,
        staggerChildren: 0.1
      }
    }
  };

  const noteVariants = {
    hidden: { 
      opacity: 0, 
      y: 20,
      scale: 0.95 
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 20
      }
    },
    hover: {
      scale: 1.03,
      boxShadow: '0 10px 20px rgba(0, 0, 0, 0.12)',
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 10
      }
    }
  };

  return (
    <motion.div 
      className={`w-1/3 p-4 rounded-lg ${color}`}
      initial="hidden"
      animate="visible"
      variants={columnVariants}
    >
      <motion.h2 
        className="text-lg font-semibold mb-4"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        {title}
      </motion.h2>
      <div className="space-y-4">
        {notes.map((note) => (
          <motion.div 
            key={note.id}
            initial="hidden"
            animate="visible"
            whileHover="hover"
            variants={noteVariants}
            className="bg-white p-4 rounded-lg shadow-md cursor-pointer"
          >
            <div className="flex justify-between items-center">
              <motion.h3 
                className="font-medium"
                whileHover={{ scale: 1.02, transition: { type: 'spring', stiffness: 300, damping: 10 } }}
              >
                {note.title}
              </motion.h3>
              {note.emoji && (
                <motion.span 
                  initial={{ rotate: -180, scale: 0 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                >
                  {note.emoji}
                </motion.span>
              )}
            </div>
            <p className="text-sm text-gray-600 mt-2 line-clamp-2">
              {note.content}
            </p>
            {note.categories && note.categories.length > 0 && (
              <motion.div 
                className="flex space-x-2 mt-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {note.categories.map((category) => (
                  <motion.span 
                    key={category} 
                    className="text-xs bg-gray-100 px-2 py-1 rounded"
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 10 }}
                  >
                    {category}
                  </motion.span>
                ))}
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default KanbanColumn;
