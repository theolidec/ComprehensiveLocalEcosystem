import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { X, RefreshCw, FileText, Download } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'https://localhost:3443';

const DocumentViewer = () => {
  const { fileId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [collaboraUrl, setCollaboraUrl] = useState(null);
  const [fileInfo, setFileInfo] = useState(null);
  const [isNew, setIsNew] = useState(false);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const docType = searchParams.get('type');
    
    if (location.pathname === '/files/document/new' && docType) {
      setIsNew(true);
      createNewDocument(docType);
    } else if (fileId) {
      loadDocument();
    } else {
      setError('No document specified');
      setLoading(false);
    }
  }, [fileId, location.search, location.pathname]);

  const createNewDocument = async (type) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(`${API_URL}/wopi/create/${type}`, {
        name: getDefaultName(type)
      }, {
        withCredentials: true
      });
      
      if (response.data.actionUrl) {
        setFileInfo(response.data.file);
        setCollaboraUrl(response.data.actionUrl);
        // Update URL to the new file ID without reloading
        window.history.replaceState(null, '', `/files/document/${response.data.file._id}`);
      } else {
        setError('Failed to create document');
      }
    } catch (err) {
      console.error('Failed to create document:', err);
      setError(err.response?.data?.error || 'Failed to create document');
    } finally {
      setLoading(false);
    }
  };

  const getDefaultName = (type) => {
    const date = new Date().toISOString().split('T')[0];
    const names = {
      word: `Document_${date}.docx`,
      excel: `Spreadsheet_${date}.xlsx`,
      powerpoint: `Presentation_${date}.pptx`,
      odt: `Document_${date}.odt`
    };
    return names[type] || `Document_${date}.docx`;
  };

  const loadDocument = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const fileResponse = await axios.get(`${API_URL}/api/files/${fileId}`, {
        withCredentials: true
      });
      setFileInfo(fileResponse.data);

      const tokenResponse = await axios.get(`${API_URL}/wopi/collabora/token/${fileId}`, {
        withCredentials: true
      });
      
      if (tokenResponse.data.actionUrl) {
        setCollaboraUrl(tokenResponse.data.actionUrl);
      } else {
        setError('Failed to get Collabora URL');
      }
    } catch (err) {
      console.error('Failed to load document:', err);
      setError(err.response?.data?.error || 'Failed to load document');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    navigate('/files');
  };

  const handleDownload = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/files/${fileId}/download`, {
        responseType: 'blob',
        withCredentials: true
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileInfo?.originalName || 'document');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <RefreshCw className="h-12 w-12 text-blue-500 animate-spin" />
          <p className="text-gray-600 dark:text-gray-400">
            {isNew ? 'Creating new document...' : 'Loading document editor...'}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-md">
          <div className="text-center">
            <FileText className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Failed to Load Document
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
            <div className="flex justify-center space-x-3">
              <button
                onClick={loadDocument}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Retry
              </button>
              <button
                onClick={handleClose}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Back to Files
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <FileText className="h-6 w-6 text-blue-500" />
          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              {fileInfo?.originalName || 'Document'}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {fileInfo && `${(fileInfo.size / 1024 / 1024).toFixed(2)} MB`}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleDownload}
            className="flex items-center space-x-2 px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            title="Download"
          >
            <Download className="h-5 w-5" />
            <span className="hidden sm:inline">Download</span>
          </button>
          
          <button
            onClick={handleClose}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Close"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Collabora Editor */}
      <div className="flex-1 relative">
        {collaboraUrl ? (
          <iframe
            src={collaboraUrl}
            className="w-full h-full border-0"
            title="Collabora Document Editor"
            allow="fullscreen; clipboard-read; clipboard-write"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 dark:text-gray-400">No document to display</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentViewer;
