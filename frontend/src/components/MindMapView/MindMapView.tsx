import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  const containerRef = useRef<HTMLDivElement>(null);

  // Vibrant and distinct color palette
  const categoryColors = useMemo(() => ({
    'Work 💼': '#0EA5E9',     // Bright Sky Blue
    'Personal 👤': '#22C55E', // Vivid Green
    'Ideas 💭': '#8B5CF6',    // Electric Purple
    'Tasks 📋': '#EF4444',    // Intense Red
    'Study 📚': '#F97316',    // Vibrant Orange
    'default': '#6366F1'      // Deep Indigo
  }), []);

  // Custom background generator
  const generateMindMapBackground = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx || !containerRef.current) return '';

    canvas.width = containerRef.current.clientWidth;
    canvas.height = containerRef.current.clientHeight;

    // Clear canvas
    ctx.fillStyle = 'rgba(245, 245, 255, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw subtle connection lines
    ctx.strokeStyle = 'rgba(100, 100, 255, 0.1)';
    ctx.lineWidth = 1;
    
    for (let i = 0; i < 50; i++) {
      ctx.beginPath();
      ctx.moveTo(
        Math.random() * canvas.width, 
        Math.random() * canvas.height
      );
      ctx.lineTo(
        Math.random() * canvas.width, 
        Math.random() * canvas.height
      );
      ctx.stroke();
    }

    // Add some subtle dots
    ctx.fillStyle = 'rgba(100, 100, 255, 0.2)';
    for (let i = 0; i < 200; i++) {
      ctx.beginPath();
      ctx.arc(
        Math.random() * canvas.width, 
        Math.random() * canvas.height, 
        Math.random() * 2, 
        0, 
        Math.PI * 2
      );
      ctx.fill();
    }

    return canvas.toDataURL();
  };

  const rootNodeStyle = {
    background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', // Gradient from Indigo to Purple
    color: 'white', 
    fontWeight: 'bold',
    borderRadius: '50%',
    width: '140px',
    height: '140px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 15px 35px rgba(99, 102, 241, 0.4)', // Enhanced shadow
    border: '4px solid rgba(255,255,255,0.3)', // More pronounced border
    fontSize: '16px',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: '1px'
  };

  const noteNodeStyle = (color: string) => ({
    background: `linear-gradient(145deg, ${color}, ${color}CC)`, // Vibrant gradient
    color: 'white',
    borderRadius: '15px',
    padding: '15px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.2)', // More pronounced shadow
    border: '3px solid rgba(255,255,255,0.3)', // More visible border
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    '&:hover': {
      transform: 'scale(1.08)', // Slightly more pronounced scale
      boxShadow: '0 15px 30px rgba(0,0,0,0.25)'
    }
  });

  useEffect(() => {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    // Create a root node
    const rootNode = {
      id: 'root',
      type: 'input',
      data: { label: 'My Notes' },
      position: { x: centerX, y: centerY },
      style: rootNodeStyle
    };

    // Create note nodes
    const noteNodes = notes.slice(0, 30).map((note, index) => {
      const angle = (index / notes.length) * 2 * Math.PI;
      const radius = 300 + Math.random() * 150;
      
      const nodeColor = categoryColors[note.categories?.[0] || 'default'] || categoryColors['default'];
      
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
        style: noteNodeStyle(nodeColor)
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
        stroke: 'rgba(99, 102, 241, 0.5)', 
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
        ref={containerRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="w-full h-[calc(100vh-64px)] relative"
        style={{
          backgroundImage: `url(${generateMindMapBackground()})`,
          backgroundSize: 'cover',
          backgroundBlendMode: 'soft-light'
        }}
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
        </ReactFlow>
      </motion.div>
    </React.Suspense>
  );
};

export default MindMapView;
