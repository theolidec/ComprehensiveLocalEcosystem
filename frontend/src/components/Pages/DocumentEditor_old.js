// this file is not in use, it's the old version of the document editor
// To be deleted when the new version is stable

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { 
  X, Save, Download, ArrowLeft, Printer, Copy, Clipboard,
  Bold, Italic, Underline, Strikethrough, List, ListOrdered,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Minus, Undo, Redo, Type, Image as ImageIcon, Link2,
  MoreHorizontal, FileText, CheckCircle, RefreshCw
} from 'lucide-react';
import fileStorageService from '../../services/fileService';

const API_URL = process.env.REACT_APP_API_URL || 'https://localhost:3443';
const { fileService } = fileStorageService;

const FONT_SIZES = [10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72];
const FONT_FAMILIES = [
  { name: 'Normal', value: 'inherit' },
  { name: 'Arial', value: 'Arial, sans-serif' },
  { name: 'Times New Roman', value: '"Times New Roman", serif' },
  { name: 'Courier New', value: '"Courier New", monospace' },
  { name: 'Georgia', value: 'Georgia, serif' },
  { name: 'Verdana', value: 'Verdana, sans-serif' },
  { name: 'Roboto', value: 'Roboto, sans-serif' },
];

const DocumentEditor = () => {
  const { fileId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [documentName, setDocumentName] = useState('Untitled Document');
  const [originalContent, setOriginalContent] = useState('');
  const [showFontMenu, setShowFontMenu] = useState(false);
  const [showSizeMenu, setShowSizeMenu] = useState(false);
  const [showInsertMenu, setShowInsertMenu] = useState(false);
  const [fileInfo, setFileInfo] = useState(null);
  const [isNewDocument, setIsNewDocument] = useState(false);
  const [currentFolder, setCurrentFolder] = useState(null);

  const isNew = fileId === 'new' || !fileId;
  const folderIdParam = searchParams.get('folderId');

  useEffect(() => {
    if (folderIdParam) {
      setCurrentFolder(folderIdParam);
    }
  }, [folderIdParam]);

  const loadDocument = useCallback(async () => {
    if (isNew) {
      setIsNewDocument(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const infoResponse = await axios.get(`${API_URL}/api/files/${fileId}`, {
        withCredentials: true
      });
      const fileData = infoResponse.data;
      setFileInfo(fileData);
      setDocumentName(fileData.originalName || 'Untitled Document');

      try {
        const contentResponse = await fileService.getFileContent(fileId);
        const content = contentResponse.content || '';
        setOriginalContent(content);
        if (editorRef.current) {
          editorRef.current.innerHTML = content;
        }
      } catch (err) {
        console.error('Failed to load file content:', err);
      }
    } catch (err) {
      console.error('Failed to load document:', err);
    } finally {
      setLoading(false);
    }
  }, [fileId, isNew]);

  useEffect(() => {
    loadDocument();
  }, [loadDocument]);

  const handleContentChange = () => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      setHasChanges(content !== originalContent);
    }
  };

  const execCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleContentChange();
  };

  const handleFontFamily = (font) => {
    execCommand('fontName', font.value);
    setShowFontMenu(false);
  };

  const handleFontSize = (size) => {
    execCommand('fontSize', Math.log2(size).toString());
    setShowSizeMenu(false);
  };

  const handleInsertLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      execCommand('createLink', url);
    }
  };

  const handleInsertImage = () => {
    fileInputRef.current?.click();
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      execCommand('insertImage', event.target.result);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSave = async () => {
    if (!editorRef.current) return;

    const content = editorRef.current.innerHTML;
    setSaving(true);

    try {
      if (isNewDocument) {
        const response = await fileService.createTextFile(
          documentName,
          content,
          currentFolder,
          'text/html'
        );
        setFileInfo(response);
        setOriginalContent(content);
        setIsNewDocument(false);
        navigate(`/files/document/edit/${response._id}`, { replace: true });
      } else {
        await fileService.updateFileContent(fileId, content);
        setOriginalContent(content);
      }
      setSaveSuccess(true);
      setHasChanges(false);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error('Save failed:', err);
      alert('Failed to save: ' + (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = () => {
    if (!editorRef.current) return;
    
    const content = editorRef.current.innerText;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = documentName.replace(/\.[^/.]+$/, '') + '.txt';
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const handleClose = () => {
    if (hasChanges) {
      if (window.confirm('You have unsaved changes. Discard them?')) {
        navigate('/files');
      }
    } else {
      navigate('/files');
    }
  };

  const handleNameChange = (e) => {
    setDocumentName(e.target.value);
    setHasChanges(true);
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

  return (
    <div className="h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center space-x-3">
          <button
            onClick={handleClose}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Back to Files"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <FileText className="h-6 w-6 text-blue-500" />
          <input
            type="text"
            value={documentName}
            onChange={handleNameChange}
            className="text-lg font-medium bg-transparent border-none outline-none text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
            placeholder="Untitled Document"
          />
          {hasChanges && (
            <span className="text-sm text-orange-500">Modified</span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleSave}
            disabled={!hasChanges && !isNewDocument || saving}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              (hasChanges || isNewDocument) && !saving
                ? 'bg-green-600 text-white hover:bg-green-700'
                : saveSuccess
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
          >
            {saveSuccess ? (
              <>
                <CheckCircle className="h-4 w-4" />
                <span>Saved!</span>
              </>
            ) : saving ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Save</span>
              </>
            )}
          </button>
          
          <button
            onClick={handleDownload}
            className="flex items-center space-x-2 px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            title="Download as text"
          >
            <Download className="h-5 w-5" />
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

      {/* Toolbar */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-2">
        <div className="flex items-center space-x-1 flex-wrap">
          {/* Undo/Redo */}
          <div className="flex items-center border-r border-gray-200 dark:border-gray-700 pr-2 mr-2">
            <button
              onClick={() => execCommand('undo')}
              className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              title="Undo (Ctrl+Z)"
            >
              <Undo className="h-4 w-4" />
            </button>
            <button
              onClick={() => execCommand('redo')}
              className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              title="Redo (Ctrl+Y)"
            >
              <Redo className="h-4 w-4" />
            </button>
          </div>

          {/* Font Family */}
          <div className="relative">
            <button
              onClick={() => { setShowFontMenu(!showFontMenu); setShowSizeMenu(false); setShowInsertMenu(false); }}
              className="flex items-center space-x-1 px-3 py-1.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-sm"
            >
              <Type className="h-4 w-4" />
              <span>Font</span>
            </button>
            {showFontMenu && (
              <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 w-48 z-50 max-h-64 overflow-y-auto">
                {FONT_FAMILIES.map((font) => (
                  <button
                    key={font.value}
                    onClick={() => handleFontFamily(font)}
                    className="w-full px-4 py-2 text-left text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
                    style={{ fontFamily: font.value }}
                  >
                    {font.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Font Size */}
          <div className="relative">
            <button
              onClick={() => { setShowSizeMenu(!showSizeMenu); setShowFontMenu(false); setShowInsertMenu(false); }}
              className="flex items-center space-x-1 px-3 py-1.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-sm"
            >
              <span className="text-sm">12</span>
            </button>
            {showSizeMenu && (
              <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 w-24 z-50 max-h-64 overflow-y-auto">
                {FONT_SIZES.map((size) => (
                  <button
                    key={size}
                    onClick={() => handleFontSize(size)}
                    className="w-full px-4 py-1.5 text-left text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
                  >
                    {size}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

          {/* Text Formatting */}
          <button
            onClick={() => execCommand('bold')}
            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            title="Bold (Ctrl+B)"
          >
            <Bold className="h-4 w-4" />
          </button>
          <button
            onClick={() => execCommand('italic')}
            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            title="Italic (Ctrl+I)"
          >
            <Italic className="h-4 w-4" />
          </button>
          <button
            onClick={() => execCommand('underline')}
            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            title="Underline (Ctrl+U)"
          >
            <Underline className="h-4 w-4" />
          </button>
          <button
            onClick={() => execCommand('strikeThrough')}
            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            title="Strikethrough"
          >
            <Strikethrough className="h-4 w-4" />
          </button>

          <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

          {/* Lists */}
          <button
            onClick={() => execCommand('insertUnorderedList')}
            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            title="Bullet list"
          >
            <List className="h-4 w-4" />
          </button>
          <button
            onClick={() => execCommand('insertOrderedList')}
            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            title="Numbered list"
          >
            <ListOrdered className="h-4 w-4" />
          </button>

          <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

          {/* Alignment */}
          <button
            onClick={() => execCommand('justifyLeft')}
            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            title="Align left"
          >
            <AlignLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => execCommand('justifyCenter')}
            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            title="Align center"
          >
            <AlignCenter className="h-4 w-4" />
          </button>
          <button
            onClick={() => execCommand('justifyRight')}
            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            title="Align right"
          >
            <AlignRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => execCommand('justifyFull')}
            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            title="Justify"
          >
            <AlignJustify className="h-4 w-4" />
          </button>

          <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

          {/* Insert */}
          <div className="relative">
            <button
              onClick={() => { setShowInsertMenu(!showInsertMenu); setShowFontMenu(false); setShowSizeMenu(false); }}
              className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              title="Insert"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
            {showInsertMenu && (
              <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 w-40 z-50">
                <button
                  onClick={() => { handleInsertLink(); setShowInsertMenu(false); }}
                  className="w-full flex items-center space-x-3 px-4 py-2 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
                >
                  <Link2 className="h-4 w-4" />
                  <span>Link</span>
                </button>
                <button
                  onClick={() => { handleInsertImage(); setShowInsertMenu(false); }}
                  className="w-full flex items-center space-x-3 px-4 py-2 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
                >
                  <ImageIcon className="h-4 w-4" />
                  <span>Image</span>
                </button>
                <button
                  onClick={() => { execCommand('insertHorizontalRule'); setShowInsertMenu(false); }}
                  className="w-full flex items-center space-x-3 px-4 py-2 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
                >
                  <Minus className="h-4 w-4" />
                  <span>Line</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-900 p-8">
        <div className="max-w-4xl mx-auto">
          <div
            ref={editorRef}
            contentEditable
            onInput={handleContentChange}
            className="min-h-[800px] bg-white dark:bg-gray-800 shadow-lg p-12 focus:outline-none"
            style={{
              fontFamily: 'Georgia, serif',
              fontSize: '16px',
              lineHeight: '1.8',
              color: '#333',
            }}
            dangerouslySetInnerHTML={{ __html: originalContent }}
          />
        </div>
      </div>

      {/* Hidden file input for image upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />
    </div>
  );
};

export default DocumentEditor;
