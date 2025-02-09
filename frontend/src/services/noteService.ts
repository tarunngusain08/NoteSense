import axios from 'axios';
import authService from './authService';

const API_BASE_URL = 'http://localhost:8080/api';

// Create an axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface Note {
  id: string;
  userId: string;
  title: string;
  content: string;
  emoji: string;
  categories: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateNoteRequest {
  title: string;
  content: string;
  emoji: string;
  categories: string[];
}

export interface UpdateNoteRequest {
  title?: string;
  content?: string;
  emoji?: string;
  categories?: string[];
}

const noteService = {
  // Get all notes for a user
  getUserNotes: async (userId: string): Promise<Note[]> => {
    try {
      const response = await noteService.api.get('/notes');
      console.log('Get notes response:', response.data); // Debug log
      if (!response.data) return [];
      const notes = response.data.Notes || [];
      console.log('Parsed notes:', notes); // Debug log
      return notes;
    } catch (error) {
      console.error('Error fetching notes:', error);
      throw error;
    }
  },

  // Get a single note by ID
  getNoteById: async (noteId: string): Promise<Note> => {
    const response = await noteService.api.get(`/notes/${noteId}`);
    return response.data;
  },

  // Create a new note
  createNote: async (note: CreateNoteRequest): Promise<Note> => {
    try {
      const response = await noteService.api.post('/notes', note);
      console.log('Create note response:', response.data); // Debug log
      if (!response.data) {
        throw new Error('No response data from create note API');
      }
      // Handle both possible response formats
      const createdNote = response.data.Note || response.data;
      console.log('Created note:', createdNote); // Debug log
      if (!createdNote || !createdNote.id) {
        throw new Error('Invalid note data in response');
      }
      return createdNote;
    } catch (error) {
      console.error('Error creating note:', error);
      throw error;
    }
  },

  // Update an existing note
  updateNote: async (noteId: string, note: UpdateNoteRequest): Promise<Note> => {
    try {
      const response = await noteService.api.put(`/notes/${noteId}`, note);
      if (!response.data || !response.data.Note) {
        throw new Error('Invalid response format from update note API');
      }
      return response.data.Note;
    } catch (error) {
      console.error('Error updating note:', error);
      throw error;
    }
  },

  // Delete a note
  deleteNote: async (noteId: string): Promise<void> => {
    try {
      await noteService.api.delete(`/notes/${noteId}`);
    } catch (error) {
      console.error('Error deleting note:', error);
      throw error;
    }
  },

  // Search notes
  searchNotes: async (query: string): Promise<Note[]> => {
    const response = await noteService.api.get('/notes/search', { 
      params: { q: query } 
    });
    return response.data;
  },

  api: api
};

export default noteService;
