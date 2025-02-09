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
    const response = await authService.api.get(`/notes/user/${userId}`);
    return response.data;
  },

  // Get a single note by ID
  getNoteById: async (noteId: string): Promise<Note> => {
    const response = await authService.api.get(`/notes/${noteId}`);
    return response.data;
  },

  // Create a new note
  createNote: async (note: CreateNoteRequest): Promise<Note> => {
    const response = await authService.api.post('/notes', note);
    return response.data;
  },

  // Update an existing note
  updateNote: async (noteId: string, note: UpdateNoteRequest): Promise<Note> => {
    const response = await authService.api.put(`/notes/${noteId}`, note);
    return response.data;
  },

  // Delete a note
  deleteNote: async (noteId: string): Promise<void> => {
    await authService.api.delete(`/notes/${noteId}`);
  },

  // Search notes
  searchNotes: async (query: string): Promise<Note[]> => {
    const response = await authService.api.get('/notes/search', { 
      params: { q: query } 
    });
    return response.data;
  }
};

export default noteService;
