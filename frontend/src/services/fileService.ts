import axios from "axios";

const API_BASE_URL = "https://backend-99l1.onrender.com"

// Create an axios instance with default config for file uploads
const fileApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "multipart/form-data",
  },
})

// Add auth token to requests if available
fileApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("token")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export interface UploadedFile {
  id: string
  userID: string
  name: string
  type: 'image' | 'audio' | 'document' | 'video'
  path: string
  size: number
  mimeType: string
  ocrText?: string
}

const fileService = {
  // Upload a file
  uploadFile: async (file: File): Promise<UploadedFile> => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fileApi.post('/files', formData);
      
      console.log('File upload response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  },

  // Optional: Upload multiple files
  uploadFiles: async (files: File[]): Promise<UploadedFile[]> => {
    try {
      const uploadPromises = files.map(file => fileService.uploadFile(file));
      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error('Error uploading multiple files:', error);
      throw error;
    }
  },
}

export default fileService;
