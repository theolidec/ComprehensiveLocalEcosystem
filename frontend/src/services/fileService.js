import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://localhost:3443';

axios.defaults.withCredentials = true;

const fileService = {
  uploadFile: async (file, folderId = null, description = '', tags = []) => {
    const formData = new FormData();
    formData.append('file', file);
    if (folderId) formData.append('folderId', folderId);
    if (description) formData.append('description', description);
    if (tags.length) formData.append('tags', tags);

    const response = await axios.post(`${API_URL}/api/files/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  getFiles: async (params = {}) => {
    const response = await axios.get(`${API_URL}/api/files`, { params });
    return response.data;
  },

  getFile: async (id) => {
    const response = await axios.get(`${API_URL}/api/files/${id}`);
    return response.data;
  },

  downloadFile: async (id) => {
    const response = await axios.get(`${API_URL}/api/files/${id}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },

  streamFile: (id) => `${API_URL}/api/files/${id}/stream`,

  getDataUrl: async (id) => {
    const response = await axios.get(`${API_URL}/api/files/${id}/dataurl`);
    return response.data;
  },

  getBlobUrl: async (id) => {
    const response = await axios.get(`${API_URL}/api/files/${id}/download`, {
      responseType: 'blob',
    });
    return URL.createObjectURL(response.data);
  },

  updateFile: async (id, data) => {
    const response = await axios.put(`${API_URL}/api/files/${id}`, data);
    return response.data;
  },

  moveFile: async (id, folderId) => {
    const response = await axios.put(`${API_URL}/api/files/${id}/move`, { folderId });
    return response.data;
  },

  deleteFile: async (id, permanent = false) => {
    const url = permanent 
      ? `${API_URL}/api/files/${id}?permanent=true`
      : `${API_URL}/api/files/${id}`;
    const response = await axios.delete(url);
    return response.data;
  },

  restoreFile: async (id) => {
    const response = await axios.post(`${API_URL}/api/files/${id}/restore`);
    return response.data;
  },

  getTrash: async () => {
    const response = await axios.get(`${API_URL}/api/files/trash`);
    return response.data;
  },

  emptyTrash: async () => {
    const response = await axios.delete(`${API_URL}/api/files/trash/empty`);
    return response.data;
  },

  shareFile: async (id, isPublic) => {
    const response = await axios.put(`${API_URL}/api/files/${id}/share`, { isPublic });
    return response.data;
  },

  getStats: async () => {
    const response = await axios.get(`${API_URL}/api/files/stats`);
    return response.data;
  },
};

const folderService = {
  createFolder: async (name, parentId = null, color = '#6b7280') => {
    const response = await axios.post(`${API_URL}/api/file-folders`, { name, parentId, color });
    return response.data;
  },

  getFolders: async (parentId = null) => {
    const response = await axios.get(`${API_URL}/api/file-folders`, { 
      params: parentId ? { parentId } : {} 
    });
    return response.data;
  },

  getAllFolders: async () => {
    const response = await axios.get(`${API_URL}/api/file-folders/all`);
    return response.data;
  },

  getFolderPath: async (id) => {
    const response = await axios.get(`${API_URL}/api/file-folders/path/${id}`);
    return response.data;
  },

  updateFolder: async (id, data) => {
    const response = await axios.put(`${API_URL}/api/file-folders/${id}`, data);
    return response.data;
  },

  moveFolder: async (id, parentId) => {
    const response = await axios.put(`${API_URL}/api/file-folders/${id}/move`, { parentId });
    return response.data;
  },

  deleteFolder: async (id, permanent = false) => {
    const url = permanent 
      ? `${API_URL}/api/file-folders/${id}?permanent=true`
      : `${API_URL}/api/file-folders/${id}`;
    const response = await axios.delete(url);
    return response.data;
  },

  restoreFolder: async (id) => {
    const response = await axios.post(`${API_URL}/api/file-folders/${id}/restore`);
    return response.data;
  },
};

const fileStorageService = { fileService, folderService };
export default fileStorageService;
