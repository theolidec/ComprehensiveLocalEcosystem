import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/fetchClient';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import DOMPurify from 'dompurify';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { 
  X, RefreshCw, FileText, Download, File, Image, Video, FileCode,
  Save, Edit2, Eye, ArrowLeft, CheckCircle, Edit3
} from 'lucide-react';

import fileStorageService from '../../services/fileService';
import { formatFileSize } from '../../utils/format';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const API_URL = process.env.REACT_APP_API_URL || 'https://localhost:3443';
const { fileService } = fileStorageService;

// Supported text mime types for editing
const EDITABLE_TEXT_TYPES = [
  'text/plain',
  'text/markdown',
  'text/html',
  'text/css',
  'text/javascript',
  'application/javascript',
  'application/json',
  'text/xml',
  'application/xml',
];

// Format support registry - easily expandable for new formats
const FORMAT_SUPPORT = {
  'text/plain': { editable: true, label: 'Plain Text', extension: '.txt' },
  'text/markdown': { editable: true, label: 'Markdown', extension: '.md' },
  'text/html': { editable: true, label: 'HTML', extension: '.html' },
  'text/css': { editable: true, label: 'CSS', extension: '.css' },
  'text/javascript': { editable: true, label: 'JavaScript', extension: '.js' },
  'application/javascript': { editable: true, label: 'JavaScript', extension: '.js' },
  'application/json': { editable: true, label: 'JSON', extension: '.json' },
  'text/xml': { editable: true, label: 'XML', extension: '.xml' },
  'application/xml': { editable: true, label: 'XML', extension: '.xml' },
};

// Markdown Renderer Component
const MarkdownPreview = ({ content }) => {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
    </div>
  );
};

const DocumentViewer = () => {
  const { fileId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fileInfo, setFileInfo] = useState(null);
  const [numPages, setNumPages] = useState(null);
  
  // Text editing state
  const [isEditable, setIsEditable] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showRawMarkdown, setShowRawMarkdown] = useState(false);
  const [pdfWidth, setPdfWidth] = useState(800);
  const pdfContainerRef = useRef(null);

  // Check if file type is editable
  const checkEditable = useCallback((mimeType) => {
    return EDITABLE_TEXT_TYPES.includes(mimeType);
  }, []);

  // Get format info
  const getFormatInfo = useCallback((mimeType) => {
    return FORMAT_SUPPORT[mimeType] || { editable: false, label: 'Unknown', extension: '' };
  }, []);

  // Load file info and content
  const loadFile = useCallback(async () => {
    if (!fileId) {
      setError('No file specified');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Get file metadata
      const infoResponse = await api.get(`${API_URL}/api/files/${fileId}`, {
        withCredentials: true
      });
      const fileData = infoResponse.data;
      setFileInfo(fileData);

      // Check if editable
      const editable = checkEditable(fileData.mimeType);
      setIsEditable(editable);

      // If editable text file, load content
      if (editable) {
        try {
          const contentResponse = await fileService.getFileContent(fileId);
          setContent(contentResponse.content || '');
          setOriginalContent(contentResponse.content || '');
        } catch (err) {
          console.error('Failed to load file content:', err);
          setContent('');
          setOriginalContent('');
        }
      }
    } catch (err) {
      console.error('Failed to load file:', err);
      setError(err.response?.data?.error || 'Failed to load file');
    } finally {
      setLoading(false);
    }
  }, [fileId, checkEditable]);

  useEffect(() => {
    loadFile();
  }, [loadFile]);

  // Reset PDF page count when file changes
  useEffect(() => {
    setNumPages(null);
  }, [fileId]);

  // Measure PDF container width responsively
  useEffect(() => {
    if (!pdfContainerRef.current) return;
    const measure = () => {
      if (pdfContainerRef.current) {
        setPdfWidth(pdfContainerRef.current.clientWidth - 32);
      }
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(pdfContainerRef.current);
    return () => observer.disconnect();
  }, [fileInfo]);

  // Track changes
  useEffect(() => {
    setHasChanges(content !== originalContent);
  }, [content, originalContent]);

  const handleClose = () => {
    navigate('/files');
  };

  const handleDownload = async () => {
    try {
      const response = await api.get(`${API_URL}/api/files/${fileId}/download`, {
        responseType: 'blob',
        withCredentials: true
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileInfo?.originalName || 'file');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  const handleEdit = () => {
    if (fileInfo?.mimeType === 'text/html') {
      navigate(`/files/document/edit/${fileId}`);
      return;
    }
    setIsEditing(true);
    setSaveSuccess(false);
  };

  const handleView = () => {
    if (hasChanges) {
      if (window.confirm('You have unsaved changes. Discard them?')) {
        setContent(originalContent);
        setIsEditing(false);
        setSaveSuccess(false);
      }
    } else {
      setIsEditing(false);
      setSaveSuccess(false);
    }
  };

  const handleSave = async () => {
    if (!isEditable || !fileId) return;

    setSaving(true);
    setSaveSuccess(false);
    
    try {
      await fileService.updateFileContent(fileId, content);
      setOriginalContent(content);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error('Save failed:', err);
      alert('Failed to save file: ' + (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
    }
  };

  const handleContentChange = (e) => {
    setContent(e.target.value);
    setSaveSuccess(false);
  };

  const getFileIcon = (mimeType) => {
    if (!mimeType) return File;
    if (mimeType.startsWith('image/')) return Image;
    if (mimeType.startsWith('video/')) return Video;
    if (mimeType.includes('javascript') || mimeType.includes('json') || mimeType.includes('html') || mimeType.includes('css')) return FileCode;
    return FileText;
  };

  const isPreviewableMedia = (mimeType) => {
    if (!mimeType) return false;
    return mimeType.startsWith('image/') || 
           mimeType.startsWith('video/') || 
           mimeType.startsWith('audio/') || 
           mimeType === 'application/pdf';
  };

  const getPreviewUrl = () => {
    return `${API_URL}/api/files/${fileId}/download`;
  };

  if (loading) {
    return (
      <div className="h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <RefreshCw className="h-12 w-12 text-blue-500 animate-spin" />
          <p className="text-gray-600 dark:text-gray-400">Loading document...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-md">
          <div className="text-center">
            <FileText className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Failed to Load Document
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
            <div className="flex justify-center space-x-3">
              <button
                onClick={loadFile}
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

  const FileIcon = getFileIcon(fileInfo?.mimeType);
  const formatInfo = getFormatInfo(fileInfo?.mimeType);

  return (
    <div className="h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <button
            onClick={handleClose}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Back to Files"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <FileIcon className="h-6 w-6 text-blue-500" />
          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              {fileInfo?.originalName || 'Document'}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {formatInfo.label} • {formatFileSize(fileInfo?.size, '')}
              {isEditable && hasChanges && <span className="ml-2 text-orange-500">• Modified</span>}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Edit/View toggle for editable files */}
          {isEditable && (
            <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1 mr-2">
              <button
                onClick={handleView}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-md transition-colors ${
                  !isEditing 
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' 
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Eye className="h-4 w-4" />
                <span className="text-sm">View</span>
              </button>
              <button
                onClick={handleEdit}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-md transition-colors ${
                  isEditing 
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' 
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {fileInfo?.mimeType === 'text/html' ? <Edit3 className="h-4 w-4" /> : <Edit2 className="h-4 w-4" />}
                <span className="text-sm">{fileInfo?.mimeType === 'text/html' ? 'Rich Edit' : 'Edit'}</span>
              </button>
            </div>
          )}

          {/* Markdown raw/formatted toggle - only in view mode */}
          {isEditable && !isEditing && fileInfo?.mimeType === 'text/markdown' && (
            <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1 mr-2">
              <button
                onClick={() => setShowRawMarkdown(false)}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-md transition-colors ${
                  !showRawMarkdown 
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' 
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Eye className="h-4 w-4" />
                <span className="text-sm">Formatted</span>
              </button>
              <button
                onClick={() => setShowRawMarkdown(true)}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-md transition-colors ${
                  showRawMarkdown 
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' 
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <FileText className="h-4 w-4" />
                <span className="text-sm">Raw</span>
              </button>
            </div>
          )}
          {isEditable && isEditing && (
            <button
              onClick={handleSave}
              disabled={!hasChanges || saving}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                hasChanges && !saving
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : saveSuccess
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
              }`}
            >
              {saveSuccess ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  <span className="hidden sm:inline">Saved!</span>
                </>
              ) : saving ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span className="hidden sm:inline">Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span className="hidden sm:inline">Save</span>
                </>
              )}
            </button>
          )}
          
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

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {isEditable ? (
          // Text Editor View
          <div className="h-full flex flex-col">
            {isEditing ? (
              // Edit Mode (plain text only — HTML uses DocumentEditor)
              <textarea
                value={content}
                onChange={handleContentChange}
                className="flex-1 w-full p-6 font-mono text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 resize-none focus:outline-none"
                spellCheck={false}
                autoFocus
              />
            ) : (
              // View Mode
              <div className="flex-1 overflow-auto p-6 bg-white dark:bg-gray-900">
                {fileInfo?.mimeType === 'text/html' ? (
                  // Rendered HTML view (sanitized)
                  <div 
                    className="prose prose-sm dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content, {
                      ADD_TAGS: ['table', 'thead', 'tbody', 'tr', 'th', 'td', 'img', 'span', 'font'],
                      ADD_ATTR: ['style', 'class', 'colspan', 'rowspan', 'color', 'bgcolor', 'face', 'size'],
                    }) }}
                  />
                ) : fileInfo?.mimeType === 'text/markdown' && !showRawMarkdown ? (
                  // Markdown formatted view
                  <MarkdownPreview content={content} />
                ) : (
                  // Plain text / raw markdown view
                  <pre className="font-mono text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words">
                    {content}
                  </pre>
                )}
              </div>
            )}
          </div>
        ) : isPreviewableMedia(fileInfo?.mimeType) ? (
          // Media Preview
          <div className="h-full flex items-center justify-center p-4 bg-gray-900">
            {fileInfo?.mimeType?.startsWith('image/') ? (
              <img 
                src={getPreviewUrl()} 
                alt={fileInfo.originalName}
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            ) : fileInfo?.mimeType?.startsWith('video/') ? (
              <video 
                src={getPreviewUrl()} 
                controls
                className="max-w-full max-h-full rounded-lg"
              >
                Your browser does not support video playback.
              </video>
            ) : fileInfo?.mimeType?.startsWith('audio/') ? (
              <div className="text-center">
                <audio
                  src={getPreviewUrl()}
                  controls
                  className="w-full max-w-lg rounded-lg"
                />
                <p className="text-gray-400 mt-3 text-sm">{fileInfo.originalName}</p>
              </div>
            ) : fileInfo?.mimeType === 'application/pdf' ? (
              <div
                ref={pdfContainerRef}
                className="w-full h-full rounded-lg overflow-auto bg-gray-100 dark:bg-gray-800 p-4"
                onClick={(e) => {
                  const link = e.target.closest('a');
                  if (link && link.href && !link.target) {
                    e.preventDefault();
                    window.open(link.href, '_blank');
                  }
                }}
              >
                <Document
                  file={getPreviewUrl()}
                  onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                  externalLinkTarget="_blank"
                  options={{
                    cMapUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/cmaps/',
                    cMapPacked: true,
                  }}
                >
                  {Array.from(new Array(numPages), (el, index) => (
                    <Page
                      key={`page_${index + 1}`}
                      pageNumber={index + 1}
                      width={pdfWidth}
                      className="mb-4"
                    />
                  ))}
                </Document>
              </div>
            ) : (
              <div className="text-center">
                <FileIcon className="h-24 w-24 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400 mb-4">Preview not available for this file type</p>
                <button
                  onClick={handleDownload}
                  className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
                >
                  <Download className="h-5 w-5" />
                  <span>Download to view</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          // Unsupported File Type
          <div className="h-full flex items-center justify-center p-4">
            <div className="text-center">
              <FileIcon className="h-24 w-24 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                This file type cannot be previewed
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
                {formatInfo.label} files are not yet supported for editing
              </p>
              <button
                onClick={handleDownload}
                className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
              >
                <Download className="h-5 w-5" />
                <span>Download file</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentViewer;
