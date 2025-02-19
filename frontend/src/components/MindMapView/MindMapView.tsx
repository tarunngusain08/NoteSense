import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Note } from '../../services/noteService';

// Dynamic import to improve build compatibility
const ReactFlow = React.lazy(() => import('reactflow'));
const Controls = React.lazy(() => import('reactflow').then(mod => ({ default: mod.Controls })));
const Background = React.lazy(() => import('reactflow').then(mod => ({ default: mod.Background })));

// Lazy load styles
const LazyStyles = React.lazy(() => {
  return import('reactflow/dist/style.css').then(module => ({
    default: () => <style>{module.default}</style>
  }));
});

interface MindMapViewProps {
  notes: Note[];
}

const MindMapView: React.FC<MindMapViewProps> = ({ notes }) => {
  const [nodes, setNodes] = useState<any[]>([]);
  const [edges, setEdges] = useState<any[]>([]);

  const categoryColors = useMemo(() => ({
    'Work 💼': '#3b82f6',
    'Personal 👤': '#10b981',
    'Ideas 💭': '#6366f1',
    'Tasks 📋': '#f43f5e',
    'Study 📚': '#8b5cf6',
    'default': '#6366f1'
  }), []);

  useEffect(() => {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    // Create a root node
    const rootNode = {
      id: 'root',
      type: 'input',
      data: { label: 'My Notes' },
      position: { x: centerX, y: centerY },
      style: { 
        background: '#6366f1', 
        color: 'white', 
        fontWeight: 'bold',
        borderRadius: '50%',
        width: '100px',
        height: '100px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }
    };

    // Create note nodes
    const noteNodes = notes.slice(0, 30).map((note, index) => {
      const angle = (index / notes.length) * 2 * Math.PI;
      const radius = 300 + Math.random() * 100;
      
      return {
        id: note.id,
        data: { 
          label: note.title,
          emoji: note.emoji || '📝'
        },
        position: {
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle)
        },
        style: {
          background: categoryColors[note.categories?.[0] || 'default'] || categoryColors['default'],
          color: 'white',
          borderRadius: '10px',
          padding: '10px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }
      };
    });

    // Create edges connecting root to notes
    const noteEdges = noteNodes.map((node) => ({
      id: `edge-root-${node.id}`,
      source: 'root',
      target: node.id,
      type: 'smoothstep',
      animated: true,
      style: { 
        stroke: '#6366f1', 
        strokeWidth: 2, 
        opacity: 0.5 
      }
    }));

    setNodes([rootNode, ...noteNodes]);
    setEdges(noteEdges);
  }, [notes, categoryColors]);

  return (
    <React.Suspense fallback={<div>Loading Mind Map...</div>}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="w-full h-[calc(100vh-64px)]"
      >
        <LazyStyles />
        <ReactFlow
          nodes={nodes}
          edges={edges}
          fitView
          attributionPosition="bottom-right"
          proOptions={{ hideAttribution: true }}
        >
          <Controls />
          <Background color="#f3f4f6" variant="dots" />
        </ReactFlow>
      </motion.div>
    </React.Suspense>
  );
};

export default MindMapView;
