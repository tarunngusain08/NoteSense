import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Network } from 'vis-network'
import { DataSet } from 'vis-data'

import mindMapService, { 
  MindMapGraph, 
  MindMapNode, 
  ConnectionType 
} from '../services/mindMapService'
import noteService, { Note } from '../services/noteService'

import { 
  FaProjectDiagram, 
  FaLink, 
  FaUnlink, 
  FaSearchPlus, 
  FaSpinner 
} from 'react-icons/fa'

const MindMapPage: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([])
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [mindMap, setMindMap] = useState<MindMapGraph | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [networkInstance, setNetworkInstance] = useState<Network | null>(null)

  // Fetch user's notes on component mount
  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const userNotes = await noteService.getUserNotes()
        setNotes(userNotes)
      } catch (error) {
        console.error('Failed to fetch notes', error)
      }
    }
    fetchNotes()
  }, [])

  // Build mind map for selected note
  const buildMindMap = async (rootNote: Note) => {
    setIsLoading(true)
    try {
      const graph = await mindMapService.buildMindMap(rootNote.id)
      setMindMap(graph)
      renderMindMapGraph(graph)
    } catch (error) {
      console.error('Failed to build mind map', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Render mind map using vis-network
  const renderMindMapGraph = (graph: MindMapGraph) => {
    const nodes = new DataSet(
      graph.nodes.map(node => ({
        id: node.note.id,
        label: node.note.title,
        title: node.note.content,
        color: getNodeColor(node)
      }))
    )

    const edges = new DataSet(
      graph.nodes.flatMap(node => 
        node.connections.map((conn, index) => ({
          id: `edge_${node.note.id}_${conn.noteId}_${index}`,
          from: node.note.id,
          to: conn.noteId,
          label: conn.connectionType,
          color: getEdgeColor(conn.connectionType)
        }))
      )
    )

    const container = document.getElementById('mind-map-container')
    if (container) {
      const network = new Network(container, { nodes, edges }, {
        layout: { improvedLayout: true },
        physics: { stabilization: false },
        interaction: { hover: true }
      })
      setNetworkInstance(network)
    }
  }

  // Utility functions for node and edge styling
  const getNodeColor = (node: MindMapNode) => {
    // Color based on note properties or connections
    return '#4A90E2'
  }

  const getEdgeColor = (connectionType: ConnectionType) => {
    const colors: Record<ConnectionType, string> = {
      [ConnectionType.PARENT]: '#2ECC71',
      [ConnectionType.CHILD]: '#3498DB',
      [ConnectionType.RELATED]: '#9B59B6',
      [ConnectionType.DEPENDS]: '#E74C3C',
      [ConnectionType.SUPPORTS]: '#F39C12'
    }
    return colors[connectionType]
  }

  // Connect two notes
  const handleConnectNotes = async (sourceNoteId: string, targetNoteId: string) => {
    try {
      await mindMapService.connectNotes(
        sourceNoteId, 
        targetNoteId, 
        ConnectionType.RELATED
      )
      // Refresh mind map after connection
      if (selectedNote) buildMindMap(selectedNote)
    } catch (error) {
      console.error('Failed to connect notes', error)
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="mind-map-page"
    >
      <div className="mind-map-header">
        <FaProjectDiagram />
        <h1>Mind Map Explorer</h1>
      </div>

      <div className="mind-map-content">
        <div className="notes-sidebar">
          <h2>Your Notes</h2>
          {notes.map(note => (
            <motion.div 
              key={note.id}
              onClick={() => buildMindMap(note)}
              whileHover={{ scale: 1.05 }}
              className="note-item"
            >
              {note.title}
            </motion.div>
          ))}
        </div>

        <div className="mind-map-visualization">
          {isLoading ? (
            <div className="loading-spinner">
              <FaSpinner color="#4A90E2" size={48} />
              <p>Generating Mind Map...</p>
            </div>
          ) : (
            <div 
              id="mind-map-container" 
              style={{ width: '100%', height: '600px' }}
            />
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default MindMapPage
