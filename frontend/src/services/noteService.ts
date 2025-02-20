import axios from "axios"
import { clearAuthData } from './authService';
import  fileService  from './fileService'; // Import fileService

// const API_BASE_URL = "https://backend-99l1.onrender.com"
const API_BASE_URL = "http://localhost:8080"

// Create an axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

// Add auth token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Add a response interceptor to handle 401 unauthorized errors
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      // Clear authentication data
      clearAuthData();
      // Redirect to login page
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export interface Note {
  id: string
  userId: string
  title: string
  content: string
  emoji: string
  categories: string[]
  createdAt: string
  updatedAt: string
}

export interface CreateNoteRequest {
  title: string
  content: string
  emoji: string
  categories: string[]
  attachments?: string[] // Array of file URLs or IDs
}

export interface UpdateNoteRequest {
  title?: string
  content?: string
  emoji?: string
  categories?: string[]
}

const noteService = {
  // Get all notes for a user
  getUserNotes: async (): Promise<Note[]> => {
    try {
      const response = await api.get('/notes');
      console.log('Get notes response:', response.data); // Debug log
      
      // Handle both possible response formats
      const notes = response.data.notes || response.data.Notes || response.data || [];
      console.log('Parsed notes:', notes); // Debug log
      
      return notes;
    } catch (error) {
      console.error('Error fetching notes:', error);
      throw error;
    }
  },

  // Get a single note by ID
  getNoteById: async (noteId: string): Promise<Note> => {
    try {
      const response = await api.get(`/notes/${noteId}`)
      console.log("Get note by ID response:", response.data) // Debug log
      if (!response.data || !response.data.Note) {
        throw new Error("Invalid response format from get note by ID API")
      }
      return response.data.Note
    } catch (error) {
      console.error("Error fetching note by ID:", error)
      throw error
    }
  },

  // Create a new note
  createNote: async (note: CreateNoteRequest, attachments?: File[]): Promise<Note> => {
    try {
      // Upload attachments first if they exist
      let attachmentUrls: string[] = [];
      if (attachments && attachments.length > 0) {
        const uploadPromises = attachments.map(file => 
          fileService.uploadFile(file)
        );
        const uploadedFiles = await Promise.all(uploadPromises);
        attachmentUrls = uploadedFiles.map(file => file.id);
      }

      // Merge attachment URLs with note request
      const noteWithAttachments = {
        ...note,
        attachments: attachmentUrls
      };

      const response = await api.post('/notes', noteWithAttachments);
      console.log('Create note response:', response.data); // Debug log
      
      // Handle both possible response formats
      return response.data.Note || response.data;
    } catch (error) {
      console.error('Error creating note:', error);
      throw error;
    }
  },

  // Update an existing note
  updateNote: async (noteId: string, note: UpdateNoteRequest): Promise<Note> => {
    try {
      const response = await api.patch(`/notes/${noteId}`, note);
      if (!response.data || !response.data.note) {
        throw new Error('Invalid response format from update note API');
      }
      return response.data.note;
    } catch (error) {
      console.error('Error updating note:', error);
      throw error;
    }
  },

  // Update note status for Kanban board
  updateNoteStatus: async (noteId: string, newStatus: string): Promise<Note> => {
    try {
      const response = await api.patch(`/notes/kanban/note/${noteId}`, { 
        status: newStatus 
      });
      
      if (!response.data || !response.data.Note) {
        throw new Error('Invalid response format from update note status API');
      }
      
      return response.data.Note;
    } catch (error) {
      console.error('Error updating note status:', error);
      throw error;
    }
  },

  // Delete a note
  deleteNote: async (noteId: string): Promise<void> => {
    try {
      await api.delete(`/notes/${noteId}`)
    } catch (error) {
      console.error("Error deleting note:", error)
      throw error
    }
  },

  // Search notes
  searchNotes: async (query: string, categories?: string[]): Promise<Note[]> => {
    const response = await api.post("/notes/search", {
      q: query,
      categories: categories || [],
    })
    return response.data.notes
  },

  // Get Kanban-organized notes
  getKanbanNotes: async (): Promise<{
    backlog: Note[];
    todo: Note[];
    in_progress: Note[];
    done: Note[];
  }> => {
    const response = await api.get("/notes/kanban")
    return response.data
  },

  api: api,
}

export default noteService
