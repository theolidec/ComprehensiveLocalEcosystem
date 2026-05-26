import api from '../utils/fetchClient';

const API_URL = process.env.REACT_APP_API_URL || 'https://localhost:3443';

const fileService = {
  uploadFile: async (file, folderId = null, description = '', tags = []) => {
    const formData = new FormData();
    formData.append('file', file);
    if (folderId) formData.append('folderId', folderId);
    if (description) formData.append('description', description);
    if (tags.length) formData.append('tags', tags);

    const response = await api.post(`${API_URL}/api/files/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  getFiles: async (params = {}) => {
    const response = await api.get(`${API_URL}/api/files`, { params });
    return response.data;
  },

  getAllFiles: async () => {
    const response = await api.get(`${API_URL}/api/files/all`);
    return response.data;
  },

  getFile: async (id) => {
    const response = await api.get(`${API_URL}/api/files/${id}`);
    return response.data;
  },

  downloadFile: async (id) => {
    const response = await api.get(`${API_URL}/api/files/${id}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },

  streamFile: (id) => `${API_URL}/api/files/${id}/stream`,

  getDataUrl: async (id) => {
    const response = await api.get(`${API_URL}/api/files/${id}/dataurl`);
    return response.data;
  },

  getBlobUrl: async (id) => {
    const response = await api.get(`${API_URL}/api/files/${id}/download`, {
      responseType: 'blob',
    });
    return URL.createObjectURL(response.data);
  },

  updateFile: async (id, data) => {
    const response = await api.put(`${API_URL}/api/files/${id}`, data);
    return response.data;
  },

  moveFile: async (id, folderId) => {
    const response = await api.put(`${API_URL}/api/files/${id}/move`, { folderId });
    return response.data;
  },

  deleteFile: async (id, permanent = false) => {
    const url = permanent 
      ? `${API_URL}/api/files/${id}?permanent=true`
      : `${API_URL}/api/files/${id}`;
    const response = await api.delete(url);
    return response.data;
  },

  restoreFile: async (id) => {
    const response = await api.post(`${API_URL}/api/files/${id}/restore`);
    return response.data;
  },

  getTrash: async () => {
    const response = await api.get(`${API_URL}/api/files/trash`);
    return response.data;
  },

  emptyTrash: async () => {
    const response = await api.delete(`${API_URL}/api/files/trash/empty`);
    return response.data;
  },

  createTextFile: async (name, content = '', folderId = null, mimeType = 'text/plain') => {
    const response = await api.post(`${API_URL}/api/files/create-text`, {
      name,
      content,
      folderId,
      mimeType
    });
    return response.data;
  },

  getFileContent: async (id) => {
    const response = await api.get(`${API_URL}/api/files/${id}/content`);
    return response.data;
  },

  updateFileContent: async (id, content) => {
    const response = await api.put(`${API_URL}/api/files/${id}/content`, { content });
    return response.data;
  },

  shareFile: async (id, isPublic) => {
    const response = await api.put(`${API_URL}/api/files/${id}/share`, { isPublic });
    return response.data;
  },

  getStats: async () => {
    const response = await api.get(`${API_URL}/api/files/stats`);
    return response.data;
  },
};

const folderService = {
  createFolder: async (name, parentId = null, color = '#6b7280') => {
    const response = await api.post(`${API_URL}/api/file-folders`, { name, parentId, color });
    return response.data;
  },

  getFolders: async (parentId = null) => {
    const response = await api.get(`${API_URL}/api/file-folders`, { 
      params: parentId ? { parentId } : {} 
    });
    return response.data;
  },

  getAllFolders: async () => {
    const response = await api.get(`${API_URL}/api/file-folders/all`);
    return response.data;
  },

  getFolderPath: async (id) => {
    const response = await api.get(`${API_URL}/api/file-folders/path/${id}`);
    return response.data;
  },

  updateFolder: async (id, data) => {
    const response = await api.put(`${API_URL}/api/file-folders/${id}`, data);
    return response.data;
  },

  moveFolder: async (id, parentId) => {
    const response = await api.put(`${API_URL}/api/file-folders/${id}/move`, { parentId });
    return response.data;
  },

  deleteFolder: async (id, permanent = false) => {
    const url = permanent 
      ? `${API_URL}/api/file-folders/${id}?permanent=true`
      : `${API_URL}/api/file-folders/${id}`;
    const response = await api.delete(url);
    return response.data;
  },

  restoreFolder: async (id) => {
    const response = await api.post(`${API_URL}/api/file-folders/${id}/restore`);
    return response.data;
  },
};

const fileStorageService = { fileService, folderService };
export default fileStorageService;
