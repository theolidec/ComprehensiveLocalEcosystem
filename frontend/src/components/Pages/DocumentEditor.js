import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../utils/fetchClient';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Highlight from '@tiptap/extension-highlight';
import { FontFamily } from '@tiptap/extension-font-family';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Placeholder from '@tiptap/extension-placeholder';
import DOMPurify from 'dompurify';
import {
  X, Save, Download, ArrowLeft, Printer, Copy,
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, List, ListOrdered,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Minus, Undo, Redo, Type, Image as ImageIcon, Link2,
  MoreHorizontal, FileText, CheckCircle, RefreshCw,
  Heading1, Heading2, Heading3, Heading4, Heading5, Heading6,
  Table as TableIcon, Palette, Highlighter, Clock,
  ChevronDown, Trash2, RotateCcw, Quote, Code
} from 'lucide-react';
import fileStorageService from '../../services/fileService';
import FontSize from '../Editor/FontSize';

const API_URL = process.env.REACT_APP_API_URL || 'https://localhost:3443';
const { fileService } = fileStorageService;

const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 32, 36, 48, 72];
const FONT_FAMILIES = [
  { name: 'Default', value: '' },
  { name: 'Arial', value: 'Arial, sans-serif' },
  { name: 'Times New Roman', value: '"Times New Roman", serif' },
  { name: 'Courier New', value: '"Courier New", monospace' },
  { name: 'Georgia', value: 'Georgia, serif' },
  { name: 'Verdana', value: 'Verdana, sans-serif' },
  { name: 'Roboto', value: 'Roboto, sans-serif' },
  { name: 'Lucida Sans Unicode', value: '"Lucida Sans Unicode", "Lucida Grande", sans-serif' },
  { name: 'Tahoma', value: 'Tahoma, Geneva, sans-serif' },
  { name: 'Trebuchet MS', value: '"Trebuchet MS", Helvetica, sans-serif' },
  { name: 'Impact', value: 'Impact, Charcoal, sans-serif' },
  { name: 'Helvetica', value: 'Helvetica, sans-serif' },
  { name: 'Garamond', value: 'Garamond, serif' },
  { name: 'Monospace', value: 'monospace' },
];

const TEXT_COLORS = [
  '#000000', '#434343', '#666666', '#999999', '#b7b7b7', '#cccccc', '#d9d9d9', '#efefef', '#f3f3f3', '#ffffff',
  '#980000', '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#4a86e8', '#0000ff', '#9900ff', '#ff00ff',
  '#e6b8af', '#f4cccc', '#fce5cd', '#fff2cc', '#d9ead3', '#d0e0e3', '#c9daf8', '#cfe2f3', '#d9d2e9', '#ead1dc',
  '#dd7e6b', '#ea9999', '#f9cb9c', '#ffe599', '#b6d7a8', '#a2c4c9', '#a4c2f4', '#9fc5e8', '#b4a7d6', '#d5a6bd',
];

const HIGHLIGHT_COLORS = [
  '#ffff00', '#00ff00', '#00ffff', '#ff69b4', '#ff9900', '#ff0000',
  '#e6b8af', '#fce5cd', '#fff2cc', '#d9ead3', '#d0e0e3', '#c9daf8',
];

const AUTO_SAVE_DELAY = 1000;

const DocumentEditor = () => {
  const { fileId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const autoSaveTimerRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [documentName, setDocumentName] = useState('Untitled Document');
  const [originalContent, setOriginalContent] = useState('');
  const [showFontMenu, setShowFontMenu] = useState(false);
  const [showSizeMenu, setShowSizeMenu] = useState(false);
  const [showHeadingMenu, setShowHeadingMenu] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [showInsertMenu, setShowInsertMenu] = useState(false);
  const [fileInfo, setFileInfo] = useState(null);
  const [isNewDocument, setIsNewDocument] = useState(false);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [showVersionPanel, setShowVersionPanel] = useState(false);
  const [versions, setVersions] = useState([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [lastAutoSave, setLastAutoSave] = useState(null);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [wordCount, setWordCount] = useState({ words: 0, chars: 0 });

  const isNew = fileId === 'new' || !fileId;
  const folderIdParam = searchParams.get('folderId');

  useEffect(() => {
    if (folderIdParam) {
      setCurrentFolder(folderIdParam);
    }
  }, [folderIdParam]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4, 5, 6] },
      }),
      Underline,
      TextStyle,
      FontSize,
      FontFamily,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Image.configure({ inline: true, allowBase64: false, HTMLAttributes: { class: 'doc-image' } }),
      Link.configure({ openOnClick: false, HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' } }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      Placeholder.configure({ placeholder: 'Start writing...' }),
    ],
    content: '',
    onUpdate: ({ editor }) => {
      setHasChanges(true);
      setSaveSuccess(false);
      if (autoSaveEnabled && !isNewDocument) {
        triggerAutoSave(editor);
      }
      const text = editor.getText();
      const words = text.trim() ? text.trim().split(/\s+/).length : 0;
      setWordCount({ words, chars: text.length });
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[800px] px-12 py-8',
      },
    },
  });

  const triggerAutoSave = useCallback((editorInstance) => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    autoSaveTimerRef.current = setTimeout(async () => {
      if (editorInstance && !isNewDocument) {
        const html = editorInstance.getHTML();
        try {
          await fileService.updateFileContent(fileId, html);
          setOriginalContent(html);
          setHasChanges(false);
          setLastAutoSave(new Date());
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 2000);
        } catch (err) {
          console.error('Auto-save failed:', err);
        }
      }
    }, AUTO_SAVE_DELAY);
  }, [fileId, isNewDocument]);

  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);

  const loadDocument = useCallback(async () => {
    if (isNew) {
      setIsNewDocument(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const infoResponse = await api.get(`${API_URL}/api/files/${fileId}`, {
        withCredentials: true
      });
      const fileData = infoResponse.data;
      setFileInfo(fileData);
      setDocumentName(fileData.originalName || 'Untitled Document');

      try {
        const contentResponse = await fileService.getFileContent(fileId);
        const content = contentResponse.content || '';
        const sanitized = DOMPurify.sanitize(content, {
          ADD_TAGS: ['table', 'thead', 'tbody', 'tr', 'th', 'td', 'img', 'span', 'font'],
          ADD_ATTR: ['style', 'class', 'colspan', 'rowspan', 'color', 'bgcolor', 'face', 'size'],
        });
        setOriginalContent(sanitized);
        if (editor) {
          editor.commands.setContent(sanitized);
        }
      } catch (err) {
        console.error('Failed to load file content:', err);
      }
    } catch (err) {
      console.error('Failed to load document:', err);
    } finally {
      setLoading(false);
    }
  }, [fileId, isNew, editor]);

  useEffect(() => {
    loadDocument();
  }, [loadDocument]);

  const loadVersions = useCallback(async () => {
    if (isNewDocument || !fileId) return;
    setLoadingVersions(true);
    try {
      const response = await api.get(`${API_URL}/api/files/${fileId}/versions`, {
        withCredentials: true
      });
      setVersions(response.data.versions || []);
    } catch (err) {
      console.error('Failed to load versions:', err);
    } finally {
      setLoadingVersions(false);
    }
  }, [fileId, isNewDocument]);

  const handleSave = async () => {
    if (!editor) return;

    const content = editor.getHTML();
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
        setHasChanges(false);
        navigate(`/files/document/edit/${response._id}`, { replace: true });
      } else {
        await fileService.updateFileContent(fileId, content);
        setOriginalContent(content);
        setHasChanges(false);
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error('Save failed:', err);
      alert('Failed to save: ' + (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadHTML = () => {
    if (!editor) return;
    const content = editor.getHTML();
    const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${documentName}</title><style>body{font-family:Georgia,serif;font-size:16px;line-height:1.8;color:#333;max-width:800px;margin:40px auto;padding:0 20px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background-color:#f5f5f5}img{max-width:100%;height:auto}</style></head><body>${content}</body></html>`;
    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = documentName.replace(/\.[^/.]+$/, '') + '.html';
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const handleDownloadText = () => {
    if (!editor) return;
    const content = editor.getText();
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = documentName.replace(/\.[^/.]+$/, '') + '.txt';
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    if (!editor) return;
    const content = editor.getHTML();
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${documentName}</title><style>body{font-family:Georgia,serif;font-size:16px;line-height:1.8;color:#333;max-width:800px;margin:40px auto;padding:0 20px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background-color:#f5f5f5}img{max-width:100%;height:auto}@media print{body{margin:0;padding:0}}</style></head><body>${content}</body></html>`);
    printWindow.document.close();
    printWindow.print();
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

  const handleInsertImage = () => {
    fileInputRef.current?.click();
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;

    try {
      const formData = new FormData();
      formData.append('image', file);
      const response = await api.post(`${API_URL}/api/files/document-image`, formData, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      editor.chain().focus().setImage({ src: response.data.url }).run();
    } catch (err) {
      console.error('Image upload failed:', err);
      alert('Failed to upload image: ' + (err.response?.data?.error || err.message));
    }
    e.target.value = '';
  };

  const handleInsertLink = () => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href;
    const url = prompt('Enter URL:', previousUrl || 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const handleRestoreVersion = async (versionId) => {
    if (!editor || !window.confirm('Restore this version? Current unsaved changes will be replaced.')) return;
    try {
      const response = await api.get(`${API_URL}/api/files/${fileId}/versions/${versionId}`, {
        withCredentials: true
      });
      const content = response.data.content || '';
      const sanitized = DOMPurify.sanitize(content, {
        ADD_TAGS: ['table', 'thead', 'tbody', 'tr', 'th', 'td', 'img', 'span', 'font'],
        ADD_ATTR: ['style', 'class', 'colspan', 'rowspan', 'color', 'bgcolor', 'face', 'size'],
      });
      editor.commands.setContent(sanitized);
      setHasChanges(true);
      setShowVersionPanel(false);
    } catch (err) {
      console.error('Failed to restore version:', err);
      alert('Failed to restore version');
    }
  };

  const closeAllMenus = () => {
    setShowFontMenu(false);
    setShowSizeMenu(false);
    setShowHeadingMenu(false);
    setShowColorPicker(false);
    setShowHighlightPicker(false);
    setShowInsertMenu(false);
    setShowDownloadMenu(false);
  };

  const getHeadingLabel = () => {
    if (!editor) return 'Normal';
    for (let i = 1; i <= 6; i++) {
      if (editor.isActive('heading', { level: i })) return `H${i}`;
    }
    return 'Normal';
  };

  const getCurrentFontName = () => {
    if (!editor) return 'Font';
    const fontFamily = editor.getAttributes('textStyle').fontFamily;
    if (!fontFamily) return 'Font';
    const found = FONT_FAMILIES.find(f => f.value === fontFamily);
    return found ? found.name : 'Font';
  };

  const getCurrentFontSize = () => {
    if (!editor) return '';
    const fontSize = editor.getAttributes('textStyle').fontSize;
    return fontSize ? fontSize.replace('px', '') : '';
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
    <div className="h-screen flex flex-col bg-gray-100 dark:bg-gray-900" onClick={closeAllMenus}>
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
          {lastAutoSave && !hasChanges && (
            <span className="text-xs text-gray-400">Auto-saved {lastAutoSave.toLocaleTimeString()}</span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => { setShowVersionPanel(!showVersionPanel); loadVersions(); }}
            className={`p-2 rounded-lg transition-colors ${showVersionPanel ? 'bg-blue-100 dark:bg-blue-900 text-blue-600' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            title="Version History"
          >
            <Clock className="h-5 w-5" />
          </button>
          <button
            onClick={handleSave}
            disabled={(!hasChanges && !isNewDocument) || saving}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              (hasChanges || isNewDocument) && !saving
                ? 'bg-green-600 text-white hover:bg-green-700'
                : saveSuccess
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
          >
            {saveSuccess ? (
              <><CheckCircle className="h-4 w-4" /><span>Saved!</span></>
            ) : saving ? (
              <><RefreshCw className="h-4 w-4 animate-spin" /><span>Saving...</span></>
            ) : (
              <><Save className="h-4 w-4" /><span>Save</span></>
            )}
          </button>
          <button
            onClick={handlePrint}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Print"
          >
            <Printer className="h-5 w-5" />
          </button>
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setShowDownloadMenu(!showDownloadMenu); }}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Download"
            >
              <Download className="h-5 w-5" />
            </button>
            {showDownloadMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 w-44 z-50">
                <button
                  onClick={() => { handleDownloadHTML(); setShowDownloadMenu(false); }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Download as HTML
                </button>
                <button
                  onClick={() => { handleDownloadText(); setShowDownloadMenu(false); }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Download as TXT
                </button>
              </div>
            )}
          </div>
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
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-2" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center space-x-1 flex-wrap">
          {/* Undo/Redo */}
          <div className="flex items-center border-r border-gray-200 dark:border-gray-700 pr-2 mr-2">
            <button
              onClick={() => editor?.chain().focus().undo().run()}
              disabled={!editor?.can().undo()}
              className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-40"
              title="Undo (Ctrl+Z)"
            >
              <Undo className="h-4 w-4" />
            </button>
            <button
              onClick={() => editor?.chain().focus().redo().run()}
              disabled={!editor?.can().redo()}
              className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-40"
              title="Redo (Ctrl+Y)"
            >
              <Redo className="h-4 w-4" />
            </button>
          </div>

          {/* Heading selector */}
          <div className="relative">
            <button
              onClick={() => { closeAllMenus(); setShowHeadingMenu(!showHeadingMenu); }}
              className="flex items-center space-x-1 px-3 py-1.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-sm min-w-[4.5rem]"
            >
              <span className="flex-1 text-left text-xs font-medium">{getHeadingLabel()}</span>
              <ChevronDown className="h-3 w-3 flex-shrink-0" />
            </button>
            {showHeadingMenu && (
              <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 w-40 z-50">
                <button onClick={() => { editor?.chain().focus().setParagraph().run(); setShowHeadingMenu(false); }} className="w-full px-4 py-2 text-left text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 text-sm">Normal text</button>
                <button onClick={() => { editor?.chain().focus().toggleHeading({ level: 1 }).run(); setShowHeadingMenu(false); }} className="w-full px-4 py-2 text-left text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 text-sm font-bold text-lg">Heading 1</button>
                <button onClick={() => { editor?.chain().focus().toggleHeading({ level: 2 }).run(); setShowHeadingMenu(false); }} className="w-full px-4 py-2 text-left text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 text-sm font-bold">Heading 2</button>
                <button onClick={() => { editor?.chain().focus().toggleHeading({ level: 3 }).run(); setShowHeadingMenu(false); }} className="w-full px-4 py-2 text-left text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 text-sm font-semibold">Heading 3</button>
                <button onClick={() => { editor?.chain().focus().toggleHeading({ level: 4 }).run(); setShowHeadingMenu(false); }} className="w-full px-4 py-2 text-left text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 text-sm">Heading 4</button>
                <button onClick={() => { editor?.chain().focus().toggleHeading({ level: 5 }).run(); setShowHeadingMenu(false); }} className="w-full px-4 py-2 text-left text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 text-sm text-xs">Heading 5</button>
                <button onClick={() => { editor?.chain().focus().toggleHeading({ level: 6 }).run(); setShowHeadingMenu(false); }} className="w-full px-4 py-2 text-left text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 text-sm text-xs">Heading 6</button>
              </div>
            )}
          </div>

          {/* Font Family */}
          <div className="relative">
            <button
              onClick={() => { closeAllMenus(); setShowFontMenu(!showFontMenu); }}
              className="flex items-center space-x-1 px-3 py-1.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-sm max-w-[130px]"
            >
              <Type className="h-4 w-4 flex-shrink-0" />
              <span className="truncate text-xs">{getCurrentFontName()}</span>
              <ChevronDown className="h-3 w-3 flex-shrink-0" />
            </button>
            {showFontMenu && (
              <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 w-48 z-50 max-h-64 overflow-y-auto">
                {FONT_FAMILIES.map((font) => (
                  <button
                    key={font.value || 'default'}
                    onClick={() => {
                      if (font.value) {
                        editor?.chain().focus().setFontFamily(font.value).run();
                      } else {
                        editor?.chain().focus().unsetFontFamily().run();
                      }
                      setShowFontMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
                    style={{ fontFamily: font.value || 'inherit' }}
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
              onClick={() => { closeAllMenus(); setShowSizeMenu(!showSizeMenu); }}
              className="flex items-center space-x-1 px-3 py-1.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-sm min-w-[3.5rem]"
            >
              <span className="text-xs flex-1 text-center">{getCurrentFontSize() || '—'}</span>
              <ChevronDown className="h-3 w-3 flex-shrink-0" />
            </button>
            {showSizeMenu && (
              <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 w-24 z-50 max-h-64 overflow-y-auto">
                {FONT_SIZES.map((size) => (
                  <button
                    key={size}
                    onClick={() => {
                      editor?.chain().focus().setFontSize(`${size}px`).run();
                      setShowSizeMenu(false);
                    }}
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
            onClick={() => editor?.chain().focus().toggleBold().run()}
            className={`p-2 rounded ${editor?.isActive('bold') ? 'bg-gray-200 dark:bg-gray-600 text-blue-600' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            title="Bold (Ctrl+B)"
          >
            <Bold className="h-4 w-4" />
          </button>
          <button
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            className={`p-2 rounded ${editor?.isActive('italic') ? 'bg-gray-200 dark:bg-gray-600 text-blue-600' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            title="Italic (Ctrl+I)"
          >
            <Italic className="h-4 w-4" />
          </button>
          <button
            onClick={() => editor?.chain().focus().toggleUnderline().run()}
            className={`p-2 rounded ${editor?.isActive('underline') ? 'bg-gray-200 dark:bg-gray-600 text-blue-600' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            title="Underline (Ctrl+U)"
          >
            <UnderlineIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => editor?.chain().focus().toggleStrike().run()}
            className={`p-2 rounded ${editor?.isActive('strike') ? 'bg-gray-200 dark:bg-gray-600 text-blue-600' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            title="Strikethrough"
          >
            <Strikethrough className="h-4 w-4" />
          </button>
          <button
            onClick={() => editor?.chain().focus().toggleBlockquote().run()}
            className={`p-2 rounded ${editor?.isActive('blockquote') ? 'bg-gray-200 dark:bg-gray-600 text-blue-600' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            title="Blockquote"
          >
            <Quote className="h-4 w-4" />
          </button>
          <button
            onClick={() => editor?.chain().focus().toggleCode().run()}
            className={`p-2 rounded ${editor?.isActive('code') ? 'bg-gray-200 dark:bg-gray-600 text-blue-600' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            title="Inline Code"
          >
            <Code className="h-4 w-4" />
          </button>

          <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

          {/* Text Color */}
          <div className="relative">
            <button
              onClick={() => { closeAllMenus(); setShowColorPicker(!showColorPicker); }}
              className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              title="Text Color"
            >
              <Palette className="h-4 w-4" />
            </button>
            {showColorPicker && (
              <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-2 z-50 w-56">
                <div className="grid grid-cols-10 gap-1">
                  {TEXT_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => { editor?.chain().focus().setColor(color).run(); setShowColorPicker(false); }}
                      className="w-5 h-5 rounded border border-gray-300 dark:border-gray-600 hover:scale-125 transition-transform"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
                <button
                  onClick={() => { editor?.chain().focus().unsetColor().run(); setShowColorPicker(false); }}
                  className="w-full mt-2 px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  Reset color
                </button>
              </div>
            )}
          </div>

          {/* Highlight */}
          <div className="relative">
            <button
              onClick={() => { closeAllMenus(); setShowHighlightPicker(!showHighlightPicker); }}
              className={`p-2 rounded ${editor?.isActive('highlight') ? 'bg-gray-200 dark:bg-gray-600 text-blue-600' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
              title="Highlight"
            >
              <Highlighter className="h-4 w-4" />
            </button>
            {showHighlightPicker && (
              <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-2 z-50 w-56">
                <div className="grid grid-cols-6 gap-1">
                  {HIGHLIGHT_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => { editor?.chain().focus().toggleHighlight({ color }).run(); setShowHighlightPicker(false); }}
                      className="w-7 h-7 rounded border border-gray-300 dark:border-gray-600 hover:scale-125 transition-transform"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
                <button
                  onClick={() => { editor?.chain().focus().unsetHighlight().run(); setShowHighlightPicker(false); }}
                  className="w-full mt-2 px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  Remove highlight
                </button>
              </div>
            )}
          </div>

          <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

          {/* Lists */}
          <button
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
            className={`p-2 rounded ${editor?.isActive('bulletList') ? 'bg-gray-200 dark:bg-gray-600 text-blue-600' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            title="Bullet list"
          >
            <List className="h-4 w-4" />
          </button>
          <button
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
            className={`p-2 rounded ${editor?.isActive('orderedList') ? 'bg-gray-200 dark:bg-gray-600 text-blue-600' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            title="Numbered list"
          >
            <ListOrdered className="h-4 w-4" />
          </button>

          <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

          {/* Alignment */}
          <button
            onClick={() => editor?.chain().focus().setTextAlign('left').run()}
            className={`p-2 rounded ${editor?.isActive({ textAlign: 'left' }) ? 'bg-gray-200 dark:bg-gray-600 text-blue-600' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            title="Align left"
          >
            <AlignLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => editor?.chain().focus().setTextAlign('center').run()}
            className={`p-2 rounded ${editor?.isActive({ textAlign: 'center' }) ? 'bg-gray-200 dark:bg-gray-600 text-blue-600' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            title="Align center"
          >
            <AlignCenter className="h-4 w-4" />
          </button>
          <button
            onClick={() => editor?.chain().focus().setTextAlign('right').run()}
            className={`p-2 rounded ${editor?.isActive({ textAlign: 'right' }) ? 'bg-gray-200 dark:bg-gray-600 text-blue-600' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            title="Align right"
          >
            <AlignRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => editor?.chain().focus().setTextAlign('justify').run()}
            className={`p-2 rounded ${editor?.isActive({ textAlign: 'justify' }) ? 'bg-gray-200 dark:bg-gray-600 text-blue-600' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            title="Justify"
          >
            <AlignJustify className="h-4 w-4" />
          </button>

          <div className="w-px h-6 bg-gray-200 dark:border-gray-700 mx-1" />

          {/* Insert Menu */}
          <div className="relative">
            <button
              onClick={() => { closeAllMenus(); setShowInsertMenu(!showInsertMenu); }}
              className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              title="Insert"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
            {showInsertMenu && (
              <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 w-48 z-50">
                <button
                  onClick={() => { handleInsertLink(); setShowInsertMenu(false); }}
                  className="w-full flex items-center space-x-3 px-4 py-2 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
                >
                  <Link2 className="h-4 w-4" /><span>Link</span>
                </button>
                <button
                  onClick={() => { handleInsertImage(); setShowInsertMenu(false); }}
                  className="w-full flex items-center space-x-3 px-4 py-2 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
                >
                  <ImageIcon className="h-4 w-4" /><span>Image</span>
                </button>
                <button
                  onClick={() => { editor?.chain().focus().setHorizontalRule().run(); setShowInsertMenu(false); }}
                  className="w-full flex items-center space-x-3 px-4 py-2 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
                >
                  <Minus className="h-4 w-4" /><span>Horizontal Line</span>
                </button>
                <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
                <button
                  onClick={() => { editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(); setShowInsertMenu(false); }}
                  className="w-full flex items-center space-x-3 px-4 py-2 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
                >
                  <TableIcon className="h-4 w-4" /><span>Table (3×3)</span>
                </button>
                <button
                  onClick={() => { editor?.chain().focus().addRowBefore().run(); setShowInsertMenu(false); }}
                  className="w-full flex items-center space-x-3 px-4 py-2 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
                  disabled={!editor?.can().addRowBefore()}
                >
                  <span className="w-4 text-center">↑</span><span>Row Above</span>
                </button>
                <button
                  onClick={() => { editor?.chain().focus().addRowAfter().run(); setShowInsertMenu(false); }}
                  className="w-full flex items-center space-x-3 px-4 py-2 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
                  disabled={!editor?.can().addRowAfter()}
                >
                  <span className="w-4 text-center">↓</span><span>Row Below</span>
                </button>
                <button
                  onClick={() => { editor?.chain().focus().addColumnBefore().run(); setShowInsertMenu(false); }}
                  className="w-full flex items-center space-x-3 px-4 py-2 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
                  disabled={!editor?.can().addColumnBefore()}
                >
                  <span className="w-4 text-center">←</span><span>Column Left</span>
                </button>
                <button
                  onClick={() => { editor?.chain().focus().addColumnAfter().run(); setShowInsertMenu(false); }}
                  className="w-full flex items-center space-x-3 px-4 py-2 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
                  disabled={!editor?.can().addColumnAfter()}
                >
                  <span className="w-4 text-center">→</span><span>Column Right</span>
                </button>
                <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
                <button
                  onClick={() => { editor?.chain().focus().deleteRow().run(); setShowInsertMenu(false); }}
                  className="w-full flex items-center space-x-3 px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm"
                  disabled={!editor?.can().deleteRow()}
                >
                  <Trash2 className="h-4 w-4" /><span>Delete Row</span>
                </button>
                <button
                  onClick={() => { editor?.chain().focus().deleteColumn().run(); setShowInsertMenu(false); }}
                  className="w-full flex items-center space-x-3 px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm"
                  disabled={!editor?.can().deleteColumn()}
                >
                  <Trash2 className="h-4 w-4" /><span>Delete Column</span>
                </button>
                <button
                  onClick={() => { editor?.chain().focus().deleteTable().run(); setShowInsertMenu(false); }}
                  className="w-full flex items-center space-x-3 px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm"
                  disabled={!editor?.can().deleteTable()}
                >
                  <Trash2 className="h-4 w-4" /><span>Delete Table</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor Area */}
        <div className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-900 p-8">
          <div className="max-w-4xl mx-auto">
            <div className="min-h-[800px] bg-white dark:bg-gray-800 shadow-lg">
              <EditorContent editor={editor} />
            </div>
          </div>
        </div>

        {/* Version History Panel */}
        {showVersionPanel && (
          <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 overflow-auto flex-shrink-0">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Version History</h3>
                <button onClick={() => setShowVersionPanel(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                  <X className="h-4 w-4" />
                </button>
              </div>
              {loadingVersions ? (
                <div className="flex justify-center py-8">
                  <RefreshCw className="h-6 w-6 text-blue-500 animate-spin" />
                </div>
              ) : versions.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No versions yet. Save to create one.</p>
              ) : (
                <div className="space-y-2">
                  {versions.map((version) => (
                    <div key={version._id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(version.createdAt).toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            {version.size ? `${(version.size / 1024).toFixed(1)} KB` : ''}
                          </p>
                        </div>
                        <button
                          onClick={() => handleRestoreVersion(version._id)}
                          className="p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                          title="Restore this version"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Word count status bar */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-1.5 flex items-center justify-between text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
        <span>{wordCount.words.toLocaleString()} {wordCount.words === 1 ? 'word' : 'words'} · {wordCount.chars.toLocaleString()} characters</span>
        <span>{autoSaveEnabled ? 'Auto-save on' : 'Auto-save off'}</span>
      </div>

      {/* Hidden file input for image upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />

      {/* TipTap table styles */}
      <style>{`
        .tiptap table { border-collapse: collapse; width: 100%; margin: 1em 0; table-layout: fixed; }
        .tiptap table td, .tiptap table th { border: 2px solid #cbd5e1; padding: 6px 8px; min-width: 80px; position: relative; }
        .tiptap table th { background-color: #f1f5f9; font-weight: 600; }
        .tiptap table .selectedCell::after { z-index: 1; position: absolute; content: ""; left: 0; right: 0; top: 0; bottom: 0; background: rgba(59, 130, 246, 0.15); pointer-events: none; }
        .tiptap table .column-resize-handle { position: absolute; right: -2px; top: 0; bottom: -2px; width: 4px; background-color: #3b82f6; pointer-events: none; }
        .tiptap img { max-width: 100%; height: auto; margin: 0.5em 0; }
        .tiptap img.ProseMirror-selectednode { outline: 3px solid #3b82f6; border-radius: 4px; }
        .tiptap p.is-editor-empty:first-child::before { color: #adb5bd; content: attr(data-placeholder); float: left; height: 0; pointer-events: none; }
        .tiptap mark { border-radius: 2px; padding: 0 2px; }
        .dark .tiptap table td, .dark .tiptap table th { border-color: #475569; }
        .dark .tiptap table th { background-color: #334155; }
      `}</style>
    </div>
  );
};

export default DocumentEditor;
