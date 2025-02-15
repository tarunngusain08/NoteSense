import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, Variant, TargetAndTransition, Transition } from 'framer-motion';
import { 
  DragDropContext, 
  Droppable, 
  Draggable, 
  DropResult 
} from 'react-beautiful-dnd';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

// Interfaces
interface Note {
  id: string;
  title: string;
  content: string;
  emoji?: string;
  status: string;
  priority: number;
  categories?: string[];
}

interface KanbanColumn {
  id: string;
  title: string;
  color: string;
  notes: Note[];
}

// Priority Color Mapping
const getPriorityColor = (priority: number) => {
  switch (priority) {
    case 0: return 'bg-gray-200';
    case 1: return 'bg-green-200';
    case 2: return 'bg-yellow-200';
    case 3: return 'bg-red-200';
    default: return 'bg-gray-200';
  }
};

const KanbanBoard: React.FC = () => {
  const { user } = useAuth();
  const [columns, setColumns] = useState<KanbanColumn[]>([
    { 
      id: 'backlog', 
      title: 'Backlog', 
      color: 'bg-gray-100', 
      notes: [] 
    },
    { 
      id: 'todo', 
      title: 'To Do', 
      color: 'bg-blue-100', 
      notes: [] 
    },
    { 
      id: 'in-progress', 
      title: 'In Progress', 
      color: 'bg-yellow-100', 
      notes: [] 
    },
    { 
      id: 'done', 
      title: 'Done', 
      color: 'bg-green-100', 
      notes: [] 
    }
  ]);

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Board Animations
  const boardVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 250,
        damping: 15,
        staggerChildren: 0.1
      }
    }
  };

  const columnVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
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
      scale: 1.02,
      boxShadow: '0 10px 20px rgba(0, 0, 0, 0.1)',
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 10
      }
    }
  };

  // Fetch Kanban Notes
  useEffect(() => {
    const fetchKanbanNotes = async () => {
      if (!user) {
        setError('No user logged in');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        console.log('Fetching Kanban notes for user:', user.userId);
        
        const response = await axios.get(`/api/notes/kanban`, {
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        });

        console.log('Full Kanban Notes Response:', response.data);

        // Detailed logging of each column
        Object.entries(response.data).forEach(([columnName, notes]) => {
          console.log(`${columnName} column:`, notes);
        });

        // Update columns with fetched notes
        const updatedColumns = columns.map(column => {
          let columnNotes: Note[] = [];
          
          // Flexible mapping with fallback
          switch (column.id) {
            case 'backlog':
              columnNotes = [
                ...(response.data.backlog || []),
                ...(response.data.todo || [])
              ];
              break;
            case 'todo':
              columnNotes = response.data.todo || [];
              break;
            case 'in-progress':
              columnNotes = response.data['in-progress'] || [];
              break;
            case 'done':
              columnNotes = response.data.done || [];
              break;
          }

          return {
            ...column,
            notes: columnNotes
          };
        });

        setColumns(updatedColumns);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch Kanban notes:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchKanbanNotes();
  }, [user]);

  // Drag and Drop Handler
  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result;

    // If dropped outside a droppable area
    if (!destination) return;

    // If dropped in the same column and position
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    // Clone the current columns
    const newColumns = [...columns];
    const sourceColumn = newColumns.find(col => col.id === source.droppableId);
    const destColumn = newColumns.find(col => col.id === destination.droppableId);

    if (sourceColumn && destColumn) {
      // Remove note from source column
      const [movedNote] = sourceColumn.notes.splice(source.index, 1);
      
      // Add note to destination column
      destColumn.notes.splice(destination.index, 0, {
        ...movedNote,
        status: destination.droppableId
      });

      setColumns(newColumns);
    }
  };

  // Render loading or error states
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ 
            repeat: Infinity, 
            duration: 1, 
            ease: "linear" 
          }}
        >
          Loading...
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
        {error}
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <motion.div 
        className="flex space-x-4 p-4"
        initial="hidden"
        animate="visible"
        variants={boardVariants}
      >
        {columns.map((column) => (
          <Droppable key={column.id} droppableId={column.id}>
            {(provided) => (
              <motion.div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`w-1/4 p-4 rounded-lg ${column.color}`}
                variants={columnVariants}
                initial="hidden"
                animate="visible"
                whileHover="hover"
              >
                <motion.h2 
                  className="text-lg font-semibold mb-4"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  {column.title}
                </motion.h2>
                <div className="space-y-4">
                  {column.notes.map((note, index) => (
                    <Draggable 
                      key={note.id} 
                      draggableId={note.id} 
                      index={index}
                    >
                      {(provided) => (
                        <motion.div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          initial={{ opacity: 0, y: 20, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ 
                            type: 'spring', 
                            stiffness: 300, 
                            damping: 20 
                          }}
                          className={`
                            bg-white p-4 rounded-lg shadow-md cursor-move
                            ${getPriorityColor(note.priority)}
                          `}
                        >
                          <div className="flex justify-between items-center">
                            <motion.h3 
                              className="font-medium"
                              whileHover={{ 
                                scale: 1.02, 
                                transition: { 
                                  type: 'spring', 
                                  stiffness: 300, 
                                  damping: 10 
                                } 
                              }}
                            >
                              {note.title}
                            </motion.h3>
                            {note.emoji && (
                              <motion.span 
                                initial={{ rotate: -180, scale: 0 }}
                                animate={{ rotate: 0, scale: 1 }}
                                transition={{ 
                                  type: 'spring', 
                                  stiffness: 300, 
                                  damping: 15 
                                }}
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
                                  transition={{ 
                                    type: 'spring', 
                                    stiffness: 300, 
                                    damping: 10 
                                  }}
                                >
                                  {category}
                                </motion.span>
                              ))}
                            </motion.div>
                          )}
                        </motion.div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              </motion.div>
            )}
          </Droppable>
        ))}
      </motion.div>
    </DragDropContext>
  );
};

export default KanbanBoard;
