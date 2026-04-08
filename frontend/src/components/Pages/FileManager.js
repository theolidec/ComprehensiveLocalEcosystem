import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Upload, Folder, FolderPlus, File, FileText, Image, Film, 
  Music, Archive, Download, Trash2, Share2, 
  Star, StarOff, Search, Grid, List, ChevronRight, Home,
  X, RefreshCw, Trash, Plus, FilePlus, FileSpreadsheet, Presentation, Edit3
} from 'lucide-react';
import fileStorageService from '../../services/fileService';
import { usePageActions } from '../../contexts/PageActionsContext';

const API_URL = process.env.REACT_APP_API_URL || 'https://localhost:3443';

const { fileService, folderService } = fileStorageService;

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getFileIcon = (mimeType) => {
  if (mimeType.startsWith('image/')) return <Image className="h-8 w-8 text-green-500" />;
  if (mimeType.startsWith('video/')) return <Film className="h-8 w-8 text-purple-500" />;
  if (mimeType.startsWith('audio/')) return <Music className="h-8 w-8 text-pink-500" />;
  if (mimeType.includes('pdf') || mimeType.includes('document')) return <FileText className="h-8 w-8 text-blue-500" />;
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('archive')) return <Archive className="h-8 w-8 text-yellow-600" />;
  return <File className="h-8 w-8 text-gray-500" />;
};

const FileManager = () => {
  const navigate = useNavigate();
  const { registerPageActions, clearPageActions } = usePageActions();
  const [, setDummyRefresh] = useState(0);
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [breadcrumbs, setBreadcrumbs] = useState([{ _id: null, name: 'My Files' }]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [showFileDetails, setShowFileDetails] = useState(false);
  const [showTrash, setShowTrash] = useState(false);
  const [trashFiles, setTrashFiles] = useState([]);
  const [stats, setStats] = useState(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState('#6b7280');
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ show: false, message: '', onConfirm: null });
  const [showNewDocMenu, setShowNewDocMenu] = useState(false);
  const [showCreateFileModal, setShowCreateFileModal] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileType, setNewFileType] = useState('txt');
  const [shareModal, setShareModal] = useState({ show: false, file: null, shareUrl: '', isPublic: false });

  const showConfirm = (message, onConfirm) => {
    setConfirmModal({ show: true, message, onConfirm });
  };

  const handleConfirm = () => {
    if (confirmModal.onConfirm) confirmModal.onConfirm();
    setConfirmModal({ show: false, message: '', onConfirm: null });
  };

  const loadFiles = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fileService.getFiles({ folderId: currentFolder });
      setFiles(data.files || []);
    } catch (error) {
      console.error('Failed to load files:', error);
    } finally {
      setLoading(false);
    }
  }, [currentFolder]);

  const loadFolders = useCallback(async () => {
    try {
      const data = await folderService.getFolders(currentFolder);
      setFolders(data || []);
    } catch (error) {
      console.error('Failed to load folders:', error);
    }
  }, [currentFolder]);

  const loadStats = useCallback(async () => {
    try {
      const data = await fileService.getStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  }, []);

  const loadTrash = useCallback(async () => {
    try {
      const data = await fileService.getTrash();
      setTrashFiles(data || []);
    } catch (error) {
      console.error('Failed to load trash:', error);
    }
  }, []);

  useEffect(() => {
    if (!showTrash) {
      loadFiles();
      loadFolders();
    } else {
      loadTrash();
    }
    loadStats();
  }, [loadFiles, loadFolders, loadStats, loadTrash, showTrash]);

  useEffect(() => {
    const storageWidget = stats && (
      <div className="storage-widget">
        <div className="storage-header">
          <span className="storage-label">Storage Used</span>
          <span className="storage-value">{formatFileSize(stats.usedStorage)}</span>
        </div>
        <div className="storage-bar-container">
          <div 
            className="storage-bar-fill" 
            style={{ 
              width: `${Math.min((stats.usedStorage / (stats.totalStorage || 10737418240)) * 100, 100)}%`,
              backgroundColor: (stats.usedStorage / (stats.totalStorage || 10737418240)) > 0.9 ? '#ef4444' : '#3b82f6'
            }}
          />
        </div>
        <div className="storage-footer">
          <span className="storage-total">of {formatFileSize(stats.totalStorage || 10737418240)}</span>
        </div>
      </div>
    );

    registerPageActions([
      {
        icon: <Edit3 size={18} />,
        label: 'Create File',
        onClick: () => setShowCreateFileModal(true)
      },
      {
        icon: <Plus size={18} />,
        label: 'New Folder',
        onClick: () => setShowNewFolderModal(true)
      },
      {
        icon: <Upload size={18} />,
        label: 'Upload File',
        onClick: () => document.querySelector('input[type="file"]')?.click()
      }
    ], storageWidget);
    return () => clearPageActions();
  }, [registerPageActions, clearPageActions, stats]);

  const handleFileUpload = async (e) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles.length) return;

    setUploading(true);
    try {
      for (const file of uploadedFiles) {
        await fileService.uploadFile(file, currentFolder);
      }
      await loadFiles();
      await loadStats();
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      await folderService.createFolder(newFolderName.trim(), currentFolder, newFolderColor);
      await loadFolders();
      setShowNewFolderModal(false);
      setNewFolderName('');
      setNewFolderColor('#6b7280');
    } catch (error) {
      console.error('Failed to create folder:', error);
      alert('Failed to create folder: ' + error.message);
    }
  };

  const handleCreateFile = async () => {
    if (!newFileName.trim()) return;
    try {
      const mimeType = newFileType === 'md' ? 'text/markdown' : 'text/plain';
      await fileService.createTextFile(newFileName.trim(), '', currentFolder, mimeType);
      await loadFiles();
      await loadStats();
      setShowCreateFileModal(false);
      setNewFileName('');
      setNewFileType('txt');
    } catch (error) {
      console.error('Failed to create file:', error);
      alert('Failed to create file: ' + error.message);
    }
  };

  const handleFolderClick = async (folder) => {
    setCurrentFolder(folder._id);
    setBreadcrumbs([...breadcrumbs, folder]);
  };

  const handleBreadcrumbClick = (index) => {
    const newBreadcrumbs = breadcrumbs.slice(0, index + 1);
    setBreadcrumbs(newBreadcrumbs);
    setCurrentFolder(newBreadcrumbs[index]._id);
  };

  const handleFileClick = async (file) => {
    const documentTypes = [
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.oasis.opendocument.text',
      'application/vnd.oasis.opendocument.spreadsheet',
      'application/vnd.oasis.opendocument.presentation',
      'application/rtf',
      'text/plain',
      'text/markdown'
    ];
    
    if (documentTypes.includes(file.mimeType)) {
      navigate(`/files/document/${file._id}`);
      return;
    }
    
    const isPreviewable = file.mimeType.startsWith('image/') || 
                          file.mimeType.startsWith('video/') || 
                          file.mimeType.startsWith('audio/') ||
                          file.mimeType === 'application/pdf';
    if (isPreviewable) {
      setSelectedFile(file);
      setShowFileDetails(true);
      try {
        if (file.mimeType === 'application/pdf') {
          const blobUrl = await fileService.getBlobUrl(file._id);
          setPreviewUrl(blobUrl);
        } else {
          const result = await fileService.getDataUrl(file._id);
          setPreviewUrl(result.dataUrl);
        }
      } catch (error) {
        console.error('Failed to load preview:', error);
        setPreviewUrl(null);
      }
    }
  };

  const handleDownload = async (file) => {
    try {
      const blob = await fileService.downloadFile(file._id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.originalName;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleDelete = async (file) => {
    showConfirm('Move this file to trash?', async () => {
      try {
        await fileService.deleteFile(file._id);
        await loadFiles();
        await loadStats();
      } catch (error) {
        console.error('Delete failed:', error);
      }
    });
  };

  const handlePermanentDelete = async (file) => {
    showConfirm('Permanently delete this file? This cannot be undone.', async () => {
      try {
        await fileService.deleteFile(file._id, true);
        await loadTrash();
        await loadStats();
      } catch (error) {
        console.error('Delete failed:', error);
      }
    });
  };

  const handleRestore = async (file) => {
    try {
      await fileService.restoreFile(file._id);
      await loadTrash();
      await loadStats();
    } catch (error) {
      console.error('Restore failed:', error);
    }
  };

  const handleToggleFavorite = async (file) => {
    try {
      await fileService.updateFile(file._id, { isFavorite: !file.isFavorite });
      await loadFiles();
    } catch (error) {
      console.error('Failed to update favorite:', error);
    }
  };

  const handleShare = async (file) => {
    try {
      const result = await fileService.shareFile(file._id, !file.isPublic);
      if (result.shareUrl) {
        const fullUrl = window.location.origin + result.shareUrl;
        setShareModal({
          show: true,
          file,
          shareUrl: fullUrl,
          isPublic: true
        });
      } else if (result.isPublic === false) {
        setShareModal({
          show: true,
          file,
          shareUrl: '',
          isPublic: false
        });
      }
      await loadFiles();
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareModal.shareUrl);
      alert('Link copied to clipboard!');
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  const handleEmptyTrash = async () => {
    showConfirm('Permanently delete all items in trash? This cannot be undone.', async () => {
      try {
        await fileService.emptyTrash();
        await loadTrash();
        await loadStats();
      } catch (error) {
        console.error('Empty trash failed:', error);
      }
    });
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFiles = e.dataTransfer.files;
    if (!droppedFiles.length) return;

    setUploading(true);
    try {
      for (const file of droppedFiles) {
        await fileService.uploadFile(file, currentFolder);
      }
      await loadFiles();
      await loadStats();
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const filteredFiles = searchQuery 
    ? files.filter(f => f.originalName.toLowerCase().includes(searchQuery.toLowerCase()))
    : files;

  return (
    <div 
      className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6"
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      {dragOver && (
        <div className="fixed inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-xl text-center">
            <Upload className="h-16 w-16 text-blue-500 mx-auto mb-4" />
            <p className="text-xl font-semibold text-gray-900 dark:text-white">Drop files to upload</p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {showTrash ? 'Trash' : 'My Files'}
            </h1>
            {stats && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {formatFileSize(stats.usedStorage)} used
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {!showTrash && (
              <>
                <div className="relative">
                  <button
                    onClick={() => setShowNewDocMenu(!showNewDocMenu)}
                    className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <FilePlus className="h-4 w-4" />
                    <span>New Doc</span>
                  </button>
                  {showNewDocMenu && (
                    <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-2 w-48 z-50">
                      <button
                        onClick={() => { setShowNewDocMenu(false); navigate('/files/document/new?type=word'); }}
                        className="w-full flex items-center space-x-3 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
                      >
                        <FileText className="h-4 w-4 text-blue-500" />
                        <span className="text-gray-900 dark:text-white">Word Document</span>
                      </button>
                      <button
                        onClick={() => { setShowNewDocMenu(false); navigate('/files/document/new?type=excel'); }}
                        className="w-full flex items-center space-x-3 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
                      >
                        <FileSpreadsheet className="h-4 w-4 text-green-500" />
                        <span className="text-gray-900 dark:text-white">Spreadsheet</span>
                      </button>
                      <button
                        onClick={() => { setShowNewDocMenu(false); navigate('/files/document/new?type=powerpoint'); }}
                        className="w-full flex items-center space-x-3 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
                      >
                        <Presentation className="h-4 w-4 text-orange-500" />
                        <span className="text-gray-900 dark:text-white">Presentation</span>
                      </button>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setShowNewFolderModal(true)}
                  className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  <FolderPlus className="h-4 w-4" />
                  <span>New Folder</span>
                </button>
                <label className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
                  <Upload className="h-4 w-4" />
                  <span>Upload</span>
                  <input type="file" multiple onChange={handleFileUpload} className="hidden" />
                </label>
              </>
            )}
            {showTrash && trashFiles.length > 0 && (
              <button
                onClick={handleEmptyTrash}
                className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                <span>Empty Trash</span>
              </button>
            )}
            <button
              onClick={() => { setShowTrash(!showTrash); setSearchQuery(''); }}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                showTrash 
                  ? 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <Trash className="h-4 w-4" />
              <span>Trash</span>
              {stats?.trashCount > 0 && (
                <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {stats.trashCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {!showTrash && (
          <div className="flex items-center space-x-2 mb-4">
            <button
              onClick={() => { setBreadcrumbs([{ _id: null, name: 'My Files' }]); setCurrentFolder(null); }}
              className="flex items-center space-x-1 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
            >
              <Home className="h-4 w-4" />
            </button>
            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={crumb._id || 'root'}>
                <ChevronRight className="h-4 w-4 text-gray-400" />
                <button
                  onClick={() => handleBreadcrumbClick(index)}
                  className={`text-sm ${
                    index === breadcrumbs.length - 1
                      ? 'text-gray-900 dark:text-white font-medium'
                      : 'text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400'
                  }`}
                >
                  {crumb.name}
                </button>
              </React.Fragment>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center space-x-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
            >
              <Grid className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
            >
              <List className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
          </div>
        ) : showTrash ? (
          trashFiles.length === 0 ? (
            <div className="text-center py-12">
              <Trash className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">Trash is empty</p>
            </div>
          ) : (
            <div className={viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4' : 'space-y-2'}>
              {trashFiles.map((file) => (
                <div
                  key={file._id}
                  className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow ${
                    viewMode === 'list' ? 'flex items-center justify-between' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {getFileIcon(file.mimeType)}
                    <div className={viewMode === 'list' ? '' : 'mt-2'}>
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[150px]">
                        {file.originalName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(file.deletedAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 mt-2">
                    <button
                      onClick={() => handleRestore(file)}
                      className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900 rounded"
                      title="Restore"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handlePermanentDelete(file)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded"
                      title="Delete permanently"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <>
            {folders.length === 0 && filteredFiles.length === 0 ? (
              <div className="text-center py-12">
                <Folder className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 mb-4">No files yet</p>
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  Drag and drop files here or click Upload to get started
                </p>
              </div>
            ) : (
              <div className={viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4' : 'space-y-2'}>
                {folders.map((folder) => (
                  <div
                    key={folder._id}
                    onClick={() => handleFolderClick(folder)}
                    className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer ${
                      viewMode === 'list' ? 'flex items-center justify-between' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Folder className="h-8 w-8" style={{ color: folder.color }} />
                      <span className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[150px]">
                        {folder.name}
                      </span>
                    </div>
                    {viewMode === 'list' && <ChevronRight className="h-4 w-4 text-gray-400" />}
                  </div>
                ))}
                {filteredFiles.map((file) => (
                  <div
                    key={file._id}
                    className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow ${
                      viewMode === 'list' ? 'flex items-center justify-between' : ''
                    }`}
                  >
                    <div 
                      className="flex items-center space-x-3 cursor-pointer"
                      onClick={() => handleFileClick(file)}
                    >
                      {getFileIcon(file.mimeType)}
                      <div className={viewMode === 'list' ? '' : 'mt-2'}>
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[150px]">
                          {file.originalName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatFileSize(file.size)} • {formatDate(file.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 mt-2">
                      <button
                        onClick={() => handleToggleFavorite(file)}
                        className="p-2 text-gray-400 hover:text-yellow-500 rounded"
                        title={file.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        {file.isFavorite ? <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" /> : <StarOff className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => handleShare(file)}
                        className="p-2 text-gray-400 hover:text-blue-500 rounded"
                        title="Share"
                      >
                        <Share2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDownload(file)}
                        className="p-2 text-gray-400 hover:text-green-500 rounded"
                        title="Download"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(file)}
                        className="p-2 text-gray-400 hover:text-red-500 rounded"
                        title="Move to trash"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {uploading && (
          <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Uploading...</span>
          </div>
        )}
      </div>

      {showNewFolderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">New Folder</h2>
              <button onClick={() => setShowNewFolderModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <input
              type="text"
              placeholder="Folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white mb-4"
              autoFocus
            />
            <div className="flex items-center space-x-2 mb-4">
              <span className="text-sm text-gray-500">Color:</span>
              <input
                type="color"
                value={newFolderColor}
                onChange={(e) => setNewFolderColor(e.target.value)}
                className="w-8 h-8 rounded cursor-pointer"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowNewFolderModal(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFolder}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {showFileDetails && selectedFile && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50" onClick={() => { setShowFileDetails(false); setPreviewUrl(null); }}>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-4xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{selectedFile.originalName}</h2>
              <button onClick={() => setShowFileDetails(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex justify-center mb-4">
              {selectedFile.mimeType.startsWith('image/') && previewUrl && (
                <img 
                  src={previewUrl} 
                  alt={selectedFile.originalName}
                  className="max-h-[60vh] max-w-full rounded-lg object-contain"
                />
              )}
              {selectedFile.mimeType.startsWith('video/') && previewUrl && (
                <video 
                  src={previewUrl}
                  controls
                  className="max-h-[60vh] rounded-lg"
                />
              )}
              {selectedFile.mimeType.startsWith('audio/') && previewUrl && (
                <audio 
                  src={previewUrl}
                  controls
                  className="w-full"
                />
              )}
              {selectedFile.mimeType === 'application/pdf' && previewUrl && (
                <iframe
                  src={previewUrl}
                  title={selectedFile.originalName}
                  className="w-full h-[60vh] rounded-lg border-0"
                />
              )}
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Size:</span>
                <span className="ml-2 text-gray-900 dark:text-white">{formatFileSize(selectedFile.size)}</span>
              </div>
              <div>
                <span className="text-gray-500">Type:</span>
                <span className="ml-2 text-gray-900 dark:text-white">{selectedFile.mimeType}</span>
              </div>
              <div>
                <span className="text-gray-500">Uploaded:</span>
                <span className="ml-2 text-gray-900 dark:text-white">{formatDate(selectedFile.createdAt)}</span>
              </div>
              {selectedFile.description && (
                <div className="col-span-2">
                  <span className="text-gray-500">Description:</span>
                  <span className="ml-2 text-gray-900 dark:text-white">{selectedFile.description}</span>
                </div>
              )}
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={() => handleDownload(selectedFile)}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Download className="h-4 w-4" />
                <span>Download</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-sm">
            <p className="text-gray-900 dark:text-white mb-4">{confirmModal.message}</p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setConfirmModal({ show: false, message: '', onConfirm: null })}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreateFileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Create New File</h2>
              <button 
                onClick={() => { setShowCreateFileModal(false); setNewFileName(''); setNewFileType('txt'); }} 
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <input
              type="text"
              placeholder="File name"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white mb-4"
              autoFocus
            />
            <div className="mb-4">
              <span className="text-sm text-gray-500 dark:text-gray-400 block mb-2">File type:</span>
              <div className="flex space-x-2">
                <button
                  onClick={() => setNewFileType('txt')}
                  className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
                    newFileType === 'txt'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <FileText className="h-4 w-4" />
                  <span className="text-gray-900 dark:text-white">.txt</span>
                </button>
                <button
                  onClick={() => setNewFileType('md')}
                  className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
                    newFileType === 'md'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <FileText className="h-4 w-4" />
                  <span className="text-gray-900 dark:text-white">.md</span>
                </button>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => { setShowCreateFileModal(false); setNewFileName(''); setNewFileType('txt'); }}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFile}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {shareModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Share File</h2>
              <button onClick={() => setShareModal({ show: false, file: null, shareUrl: '', isPublic: false })} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-gray-600 dark:text-gray-400 mb-2">File: <span className="font-medium text-gray-900 dark:text-white">{shareModal.file?.originalName}</span></p>
            </div>

            {shareModal.isPublic && shareModal.shareUrl ? (
              <>
                <div className="mb-4">
                  <label className="block text-sm text-gray-500 dark:text-gray-400 mb-2">Share link:</label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      readOnly
                      value={shareModal.shareUrl}
                      className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
                    />
                    <button
                      onClick={copyShareLink}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-1"
                    >
                      <Share2 className="h-4 w-4" />
                      <span>Copy</span>
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                  Anyone with this link can view the file.
                </p>
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-600 dark:text-gray-400 mb-4">This file is not shared publicly.</p>
                <button
                  onClick={() => handleShare(shareModal.file)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Share Link
                </button>
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-4 border-t">
              <button
                onClick={() => setShareModal({ show: false, file: null, shareUrl: '', isPublic: false })}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileManager;
