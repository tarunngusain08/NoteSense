import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Grid2X2, Kanban } from 'lucide-react';

// Import existing components
import GridNoteView from '../GridView/GridNoteView';
import KanbanBoard from '../KanbanBoard/KanbanBoard';

// Toggle Button Component
const ViewToggleButton: React.FC<{
  isKanbanView: boolean;
  onToggle: () => void;
}> = ({ isKanbanView, onToggle }) => {
  return (
    <motion.button
      onClick={onToggle}
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
        {isKanbanView ? (
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
  );
};

// Main Notes View Toggle Component
const NotesViewToggle: React.FC = () => {
  const [isKanbanView, setIsKanbanView] = useState(false);

  const toggleView = () => {
    setIsKanbanView(!isKanbanView);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ 
        duration: 0.5,
        type: 'spring',
        stiffness: 100,
        damping: 20
      }}
      className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100"
    >
      <AnimatePresence mode="wait">
        {isKanbanView ? (
          <motion.div
            key="kanban-view"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ 
              type: 'spring', 
              stiffness: 300, 
              damping: 20 
            }}
          >
            <KanbanBoard />
          </motion.div>
        ) : (
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
            <GridNoteView />
          </motion.div>
        )}
      </AnimatePresence>

      <ViewToggleButton 
        isKanbanView={isKanbanView} 
        onToggle={toggleView} 
      />
    </motion.div>
  );
};

export default NotesViewToggle;
