import axios from 'axios';

// const API_BASE_URL = "http://localhost:8080";
const API_BASE_URL = "https://notesense-backend.onrender.com";

// Create an axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

// Add auth token to requests if available
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

// Function to upload files
const uploadFiles = async (files: File[], noteId: string): Promise<any> => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('file', file);
    });
    formData.append('noteId', noteId); // Add noteId to the form data
  
    try {
      const response = await api.post('/api/files', formData);
      return response.data; // Return the response from the API
    } catch (error) {
      console.error('Error uploading files:', error);
      throw error; // Rethrow the error for handling in the calling function
    }
  };

// Export the file service
const fileService = {
  uploadFiles,
};

export default fileService;