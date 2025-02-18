import axios from "axios"
import noteService, { Note } from "./noteService"

// const API_BASE_URL = "https://backend-99l1.onrender.com"
const API_BASE_URL = 'http://localhost:8080';

// Create an axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

// Reuse the interceptors from noteService
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      // Clear authentication data
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error);
  }
)

// Enum for Connection Types
export enum ConnectionType {
  PARENT = 'parent',
  CHILD = 'child',
  RELATED = 'related',
  DEPENDS = 'depends',
  SUPPORTS = 'supports'
}

// Interfaces for Mind Map Structures
export interface Connection {
  noteId: string
  connectionType: ConnectionType
  weight?: number
  depth?: number
}

export interface MindMapNode {
  note: Note
  connections: Connection[]
}

export interface MindMapGraph {
  rootNote: Note
  nodes: MindMapNode[]
}

const mindMapService = {
  // Get connections for a specific note
  getNoteConnections: async (noteId: string): Promise<Connection[]> => {
    try {
      const response = await api.get(`/api/notes/${noteId}/connections`)
      return response.data.connections
    } catch (error) {
      console.error("Failed to fetch note connections", error)
      throw error
    }
  },

  // Connect two notes
  connectNotes: async (
    noteId: string, 
    connectedNoteId: string, 
    connectionType: ConnectionType
  ): Promise<void> => {
    try {
      await api.post(`/api/notes/${noteId}/connect`, {
        connectedNoteId,
        connectionType
      })
    } catch (error) {
      console.error("Failed to connect notes", error)
      throw error
    }
  },

  // Unlink two notes
  unlinkNotes: async (
    noteId: string, 
    connectedNoteId: string
  ): Promise<void> => {
    try {
      await api.delete(`/api/notes/${noteId}/unlink/${connectedNoteId}`)
    } catch (error) {
      console.error("Failed to unlink notes", error)
      throw error
    }
  },

  // Fetch initial mind map notes for the user
  getUserMindMapNotes: async (): Promise<Note[]> => {
    try {
      const response = await api.get('/notes/mindmap');
      
      // Handle different possible response structures
      if (Array.isArray(response.data)) {
        // If response is directly an array of notes
        return response.data;
      } else if (response.data.notes) {
        // If response has a 'notes' property
        return response.data.notes;
      } else {
        // If response doesn't match expected format
        console.warn('Unexpected response format for mind map notes', response.data);
        return [];
      }
    } catch (error) {
      console.error('Failed to fetch mind map notes', error);
      throw error;
    }
  },

  // Build a mind map from a root note
  buildMindMap: async (rootNoteId: string): Promise<MindMapGraph> => {
    try {
      // This is a hypothetical endpoint - you'll need to implement this in the backend
      const response = await api.get(`/api/notes/${rootNoteId}/mindmap`)
      return response.data
    } catch (error) {
      console.error("Failed to build mind map", error)
      throw error
    }
  },

  // Utility method to visualize mind map
  visualizeMindMap: (mindMap: MindMapGraph) => {
    // Placeholder for future visualization logic
    // Could integrate with a graph visualization library
    console.log("Visualizing Mind Map:", mindMap)
  }
}

export default mindMapService
