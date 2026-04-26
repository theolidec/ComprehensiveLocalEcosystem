import React, { useState, useEffect, useCallback } from 'react';
import { Folder, File, ChevronRight, ChevronDown } from 'lucide-react';
import fileStorageService from '../../services/fileService';
import './FileTree.css';

const { folderService, fileService } = fileStorageService;

const FileTreeItem = ({ item, level = 0, currentFolder, onNavigate, onMove, draggedItem, setDraggedItem }) => {
  const currentFolderStr = currentFolder ? currentFolder.toString() : null;
  const itemIdStr = item._id ? item._id.toString() : null;
  const [isOpen, setIsOpen] = useState(currentFolderStr === itemIdStr);
  const [isDragOver, setIsDragOver] = useState(false);
  const isFolder = item.type === 'folder';
  const isSelected = currentFolderStr === itemIdStr;
  const hasChildren = isFolder && item.children?.length > 0;

  const handleClick = () => {
    if (isFolder) {
      onNavigate(item);
    }
  };

  const toggleOpen = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const handleDragStart = (e) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      id: item._id,
      type: item.type,
      name: item.name
    }));
    e.dataTransfer.effectAllowed = 'move';
    setDraggedItem(item);
  };

  const handleDragOver = (e) => {
    if (isFolder && draggedItem && draggedItem._id !== item._id) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setIsDragOver(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      
      if (data.id === item._id) return;
      
      if (data.type === 'file') {
        await fileService.moveFile(data.id, item._id);
      } else if (data.type === 'folder') {
        await folderService.moveFolder(data.id, item._id);
      }
      
      onMove();
    } catch (error) {
      console.error('Failed to move item:', error);
      alert('Failed to move item: ' + error.message);
    }
  };

  return (
    <li className="tree-item" style={{ paddingLeft: `${level * 12}px` }}>
      {isFolder ? (
        <div 
          className={`tree-folder-header ${isDragOver ? 'drag-over' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <button type="button" className="tree-toggle-btn" onMouseDown={toggleOpen}>
            {hasChildren ? (isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />) : <ChevronRight size={14} className="toggle-placeholder" />}
          </button>
          <div 
            className={`tree-label ${isSelected ? 'is-selected' : ''}`}
            onClick={handleClick}
            draggable
            onDragStart={handleDragStart}
          >
            <Folder size={16} style={{ color: item.color || '#6b7280' }} />
            <span className="tree-label-text">{item.name}</span>
          </div>
        </div>
      ) : (
        <div 
          className="file-item"
          draggable
          onDragStart={handleDragStart}
        >
          <File size={16} className="file-icon" />
          <span className="file-name">{item.name}</span>
        </div>
      )}
      
      {isFolder && isOpen && (
        <ul className="tree-children">
          {item.children?.map((child) => (
            <FileTreeItem 
              key={child._id} 
              item={child} 
              level={level + 1}
              currentFolder={currentFolder}
              onNavigate={onNavigate}
              onMove={onMove}
              draggedItem={draggedItem}
              setDraggedItem={setDraggedItem}
            />
          ))}
        </ul>
      )}
    </li>
  );
};

const FileTree = ({ currentFolder, onNavigate }) => {
  const [treeData, setTreeData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draggedItem, setDraggedItem] = useState(null);

  const loadTreeData = useCallback(async () => {
    try {
      const [folders, files] = await Promise.all([
        folderService.getAllFolders(),
        fileService.getAllFiles()
      ]);
      
      const allFiles = files.files || [];
      
      const buildTree = (parentId = null, folderList = []) => {
        const parentIdStr = parentId == null ? null : parentId.toString();
        
        const childFolders = folderList
          .filter(f => {
            const fParentId = f.parentId == null ? null : f.parentId.toString();
            return fParentId === parentIdStr;
          })
          .map(folder => ({
            ...folder,
            type: 'folder',
            children: buildTree(folder._id, folderList)
          }));
        
        const childFiles = allFiles
          .filter(f => {
            const fFolderId = f.folderId == null ? null : f.folderId.toString();
            return fFolderId === parentIdStr;
          })
          .map(f => ({
            _id: f._id,
            name: f.originalName,
            type: 'file',
            mimeType: f.mimeType
          }));
        
        return [...childFolders, ...childFiles];
      };

      const tree = buildTree(null, folders);
      setTreeData(tree);
    } catch (error) {
      console.error('Failed to load tree data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTreeData();
  }, [loadTreeData]);

  const handleRootDragOver = (e) => {
    if (draggedItem) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    }
  };

  const handleRootDrop = async (e) => {
    e.preventDefault();
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      
      if (data.type === 'file') {
        await fileService.moveFile(data.id, null);
      } else if (data.type === 'folder') {
        await folderService.moveFolder(data.id, null);
      }
      
      loadTreeData();
    } catch (error) {
      console.error('Failed to move item:', error);
      alert('Failed to move item: ' + error.message);
    }
    setDraggedItem(null);
  };

  if (loading) {
    return <div className="file-tree-loading">Loading...</div>;
  }

  if (treeData.length === 0) {
    return <div className="file-tree-empty">No files or folders</div>;
  }

  return (
    <div className="file-tree-container">
      <div className="file-tree-header">
        <span>Files</span>
      </div>
      <ul 
        className="file-tree"
        onDragOver={handleRootDragOver}
        onDrop={handleRootDrop}
        onDragEnd={() => setDraggedItem(null)}
      >
        <li 
          className={`tree-item root-item ${currentFolder === null ? 'is-selected' : ''}`}
        >
          <div 
            className="tree-label"
            onClick={() => onNavigate({ _id: null, name: 'My Files' })}
            onDragOver={handleRootDragOver}
            onDrop={handleRootDrop}
          >
            <Folder size={16} />
            <span className="tree-label-text">My Files</span>
          </div>
        </li>
        {treeData.map((item) => (
          <FileTreeItem 
            key={item._id} 
            item={item} 
            currentFolder={currentFolder}
            onNavigate={onNavigate}
            onMove={loadTreeData}
            draggedItem={draggedItem}
            setDraggedItem={setDraggedItem}
          />
        ))}
      </ul>
    </div>
  );
};

export default FileTree;
