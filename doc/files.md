# Files Module

## Overview
The Files module provides comprehensive file storage and management with folder organization, trash functionality, sharing capabilities, and built-in text file editing. Supports a wide variety of file types with preview and streaming.

## Features
- **File Upload**: Single file upload with drag-and-drop support
- **Folder Management**: Hierarchical folder structure with colors
- **Trash System**: Soft delete with restore capability
- **File Sharing**: Public sharing via token-based URLs
- **Storage Stats**: Track storage usage and quotas
- **Text File Editor**: Create and edit .txt and .md files
- **File Preview**: In-browser preview for images, videos, documents
- **Favorites**: Mark files as favorites for quick access
- **Search**: Search files by name and description

## Supported File Types

### Images
JPEG, PNG, GIF, WebP, SVG, AVIF, TIFF, BMP, ICO, HEIC, HEIF

### Documents
PDF, DOC, DOCX, ODT, RTF, TXT, Markdown

### Spreadsheets
XLS, XLSX, ODS, CSV, TSV

### Presentations
PPT, PPTX, ODP

### Data & Code
JSON, XML, HTML, CSS, JavaScript

### Archives
ZIP, RAR, 7Z, TAR, GZIP, BZIP2

### Audio
MP3, WAV, OGG, AAC, FLAC, M4A

### Video
MP4, WebM, MOV, AVI, MKV, FLV, MPEG

## Data Models

### File Schema
- `userId`: ObjectId (required, indexed) - Owner reference
- `filename`: String (required, trim) - Stored filename
- `originalName`: String (required, trim) - Original filename
- `mimeType`: String (required) - MIME type
- `size`: Number (bytes, required)
- `path`: String (required) - Filesystem path
- `folderId`: ObjectId (ref: 'FileFolder', default: null)
- `description`: String (max 500 chars, default: '')
- `tags`: [String] (each max 50 chars, trim)
- `isFavorite`: Boolean (default: false)
- `isDeleted`: Boolean (default: false)
- `deletedAt`: Date (default: null)
- `isPublic`: Boolean (default: false)
- `shareToken`: String (unique, sparse)

### FileFolder Schema
- `userId`: ObjectId (required, indexed)
- `name`: String (required, trim)
- `parentId`: ObjectId (ref: 'FileFolder', default: null)
- `color`: String (hex, default: '#6b7280')
- `isDeleted`: Boolean (default: false)
- `deletedAt`: Date (default: null)

## API Endpoints

### Files (`/api/files`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/upload` | Upload file |
| GET | `/` | List files |
| GET | `/stats` | Storage statistics |
| GET | `/trash` | List deleted files |
| GET | `/shared/:token` | Access shared file |
| GET | `/:id` | File metadata |
| GET | `/:id/download` | Download |
| GET | `/:id/stream` | Stream content |
| GET | `/:id/dataurl` | Base64 preview |
| PUT | `/:id` | Update metadata |
| PUT | `/:id/move` | Move to folder |
| PUT | `/:id/share` | Toggle sharing |
| DELETE | `/:id` | Soft delete |
| DELETE | `/:id/permanent` | Permanent delete |
| POST | `/:id/restore` | Restore from trash |
| DELETE | `/trash/empty` | Empty trash |
| POST | `/create-text` | Create txt/md file |
| GET | `/:id/content` | Read text file |
| PUT | `/:id/content` | Write text file |

### Folders (`/api/file-folders`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Create folder |
| GET | `/` | List folders |
| GET | `/:id` | Folder details |
| GET | `/:id/path` | Breadcrumb path |
| PUT | `/:id` | Update folder |
| PUT | `/:id/move` | Move folder |
| DELETE | `/:id` | Delete folder |
| POST | `/:id/restore` | Restore folder |

## Frontend Components

### File Manager
- **File**: `frontend/src/components/Pages/FileManager.js`
- **Size**: ~982 lines
- Features: Grid/List views, drag-drop upload, breadcrumbs, folder tree, preview modal, trash management

### Document Editor
- **File**: `frontend/src/components/Pages/DocumentEditor.js`
- Full-featured text/markdown editor

### Document Viewer
- **File**: `frontend/src/components/Pages/DocumentViewer.js`
- Read-only file viewer

### Service
- **File**: `frontend/src/services/fileService.js`

## Backend Structure

### Controllers
- **File**: `backend/controllers/fileController.js` - File CRUD, sharing, streaming
- **Folder**: `backend/controllers/fileFolderController.js` - Folder management

### Routes
- **Files**: `backend/routes/files.js`
- **Folders**: `backend/routes/fileFolders.js`

### Configuration
- Upload directory: `backend/uploads/files/`
- Max file size: 500MB (configurable)
- Default storage quota: 10GB per user
- **Git Exclusion**: All uploaded files are excluded from version control via `.gitignore` patterns (`uploads/`, `backend/uploads/files/`, `backend/uploads/documents/`) to prevent sensitive user data from being committed to GitHub

## Error Codes
| Code | Description |
|------|-------------|
| `NO_FILE` | No file in upload |
| `UPLOAD_ERROR` | Upload failed |
| `INVALID_FOLDER` | Target folder invalid |
| `FILE_NOT_FOUND` | File doesn't exist |
| `FILE_MISSING` | File deleted from disk |
| `DOWNLOAD_ERROR` | Download failed |
| `STREAM_ERROR` | Streaming failed |
| `SHARE_ERROR` | Sharing toggle failed |
| `TRASH_ERROR` | Trash operation failed |
| `CREATE_TEXT_ERROR` | Text file creation failed |
| `CREATE_FOLDER_ERROR` | Folder creation failed |
| `GET_FILES_ERROR` | Failed to fetch files |
| `GET_FILE_ERROR` | Failed to get file |
| `DATA_URL_ERROR` | Base64 encoding failed |
| `UPDATE_ERROR` | Update failed |
| `MOVE_ERROR` | Move operation failed |
| `DELETE_ERROR` | Delete operation failed |
| `RESTORE_ERROR` | Restore failed |
| `EMPTY_TRASH_ERROR` | Empty trash failed |
| `STATS_ERROR` | Statistics calculation failed |
| `GET_CONTENT_ERROR` | Read file content failed |
| `UPDATE_CONTENT_ERROR` | Write file content failed |
| `NO_NAME` | Missing file/folder name |
| `INVALID_PARENT` | Invalid parent folder |
| `GET_FOLDERS_ERROR` | Failed to fetch folders |
| `FOLDER_NOT_FOUND` | Folder doesn't exist |
| `PATH_ERROR` | Failed to get path |
| `UPDATE_FOLDER_ERROR` | Folder update failed |
| `INVALID_MOVE` | Invalid move operation |
| `INVALID_DESTINATION` | Invalid destination |
| `MOVE_FOLDER_ERROR` | Folder move failed |
| `RESTORE_FOLDER_ERROR` | Folder restore failed |
| `GET_ALL_FOLDERS_ERROR` | Failed to list all folders |
