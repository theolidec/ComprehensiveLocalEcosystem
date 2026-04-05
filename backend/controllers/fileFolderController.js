const FileFolder = require('../models/FileFolder');
const File = require('../models/File');
const logger = require('../config/logger');

const folderController = {
  createFolder: async (req, res) => {
    try {
      const { name, parentId, color } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Folder name is required', code: 'NO_NAME' });
      }

      if (parentId) {
        const parent = await FileFolder.findOne({ _id: parentId, userId: req.user._id, isDeleted: false });
        if (!parent) {
          return res.status(400).json({ error: 'Invalid parent folder', code: 'INVALID_PARENT' });
        }
      }

      const folder = new FileFolder({
        userId: req.user._id,
        name: name.trim(),
        parentId: parentId || null,
        color: color || '#6b7280'
      });

      await folder.save();
      logger.info(`Folder created: ${folder.name} by user ${req.user.email}`);
      
      res.status(201).json(folder);
    } catch (error) {
      logger.error('Create folder error:', error);
      res.status(500).json({ error: 'Failed to create folder', code: 'CREATE_FOLDER_ERROR' });
    }
  },

  getFolders: async (req, res) => {
    try {
      const { parentId } = req.query;
      
      let query = { userId: req.user._id, isDeleted: false };
      
      if (parentId === 'null' || parentId === '' || parentId === undefined) {
        query.parentId = null;
      } else if (parentId) {
        query.parentId = parentId;
      }

      const folders = await FileFolder.find(query).sort({ name: 1 });
      res.json(folders);
    } catch (error) {
      logger.error('Get folders error:', error);
      res.status(500).json({ error: 'Failed to get folders', code: 'GET_FOLDERS_ERROR' });
    }
  },

  getFolder: async (req, res) => {
    try {
      const folder = await FileFolder.findOne({ _id: req.params.id, userId: req.user._id });
      
      if (!folder) {
        return res.status(404).json({ error: 'Folder not found', code: 'FOLDER_NOT_FOUND' });
      }

      res.json(folder);
    } catch (error) {
      logger.error('Get folder error:', error);
      res.status(500).json({ error: 'Failed to get folder', code: 'GET_FOLDER_ERROR' });
    }
  },

  getFolderPath: async (req, res) => {
    try {
      const { id } = req.params;
      
      let folderId = id;
      if (id === 'root') folderId = null;
      
      const path = await FileFolder.getPath(folderId);
      res.json(path);
    } catch (error) {
      logger.error('Get folder path error:', error);
      res.status(500).json({ error: 'Failed to get folder path', code: 'PATH_ERROR' });
    }
  },

  updateFolder: async (req, res) => {
    try {
      const { name, color } = req.body;
      
      const folder = await FileFolder.findOne({ _id: req.params.id, userId: req.user._id });
      
      if (!folder) {
        return res.status(404).json({ error: 'Folder not found', code: 'FOLDER_NOT_FOUND' });
      }

      if (name && name.trim()) folder.name = name.trim();
      if (color) folder.color = color;

      await folder.save();
      logger.info(`Folder updated: ${folder.name} by user ${req.user.email}`);
      
      res.json(folder);
    } catch (error) {
      logger.error('Update folder error:', error);
      res.status(500).json({ error: 'Failed to update folder', code: 'UPDATE_FOLDER_ERROR' });
    }
  },

  moveFolder: async (req, res) => {
    try {
      const { parentId } = req.body;
      const { id } = req.params;

      if (id === parentId) {
        return res.status(400).json({ error: 'Cannot move folder into itself', code: 'INVALID_MOVE' });
      }

      if (parentId) {
        const parent = await FileFolder.findOne({ _id: parentId, userId: req.user._id, isDeleted: false });
        if (!parent) {
          return res.status(400).json({ error: 'Invalid destination folder', code: 'INVALID_DESTINATION' });
        }

        let current = parentId;
        while (current) {
          if (current.toString() === id) {
            return res.status(400).json({ error: 'Cannot move folder into its own subfolder', code: 'INVALID_MOVE' });
          }
          const f = await FileFolder.findById(current);
          current = f?.parentId;
        }
      }

      const folder = await FileFolder.findOne({ _id: id, userId: req.user._id });
      
      if (!folder) {
        return res.status(404).json({ error: 'Folder not found', code: 'FOLDER_NOT_FOUND' });
      }

      folder.parentId = parentId || null;
      await folder.save();
      
      res.json(folder);
    } catch (error) {
      logger.error('Move folder error:', error);
      res.status(500).json({ error: 'Failed to move folder', code: 'MOVE_FOLDER_ERROR' });
    }
  },

  deleteFolder: async (req, res) => {
    try {
      const { permanent } = req.query;
      const { id } = req.params;

      const folder = await FileFolder.findOne({ _id: id, userId: req.user._id });
      
      if (!folder) {
        return res.status(404).json({ error: 'Folder not found', code: 'FOLDER_NOT_FOUND' });
      }

      if (permanent === 'true') {
        const childFolders = await FileFolder.find({ parentId: id, userId: req.user._id });
        for (const child of childFolders) {
          await FileFolder.findByIdAndDelete(child._id);
        }

        const files = await File.find({ folderId: id, userId: req.user._id });
        const fs = require('fs');
        for (const file of files) {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
          await File.findByIdAndDelete(file._id);
        }

        await FileFolder.findByIdAndDelete(id);
        logger.info(`Folder permanently deleted: ${folder.name} by user ${req.user.email}`);
        res.json({ message: 'Folder permanently deleted' });
      } else {
        const childFolders = await FileFolder.find({ parentId: id, userId: req.user._id });
        for (const child of childFolders) {
          child.isDeleted = true;
          child.deletedAt = new Date();
          await child.save();
        }

        const files = await File.find({ folderId: id, userId: req.user._id });
        for (const file of files) {
          await file.softDelete();
        }

        await folder.softDelete();
        logger.info(`Folder moved to trash: ${folder.name} by user ${req.user.email}`);
        res.json(folder);
      }
    } catch (error) {
      logger.error('Delete folder error:', error);
      res.status(500).json({ error: 'Failed to delete folder', code: 'DELETE_FOLDER_ERROR' });
    }
  },

  restoreFolder: async (req, res) => {
    try {
      const folder = await FileFolder.findOne({ _id: req.params.id, userId: req.user._id, isDeleted: true });
      
      if (!folder) {
        return res.status(404).json({ error: 'Folder not found in trash', code: 'FOLDER_NOT_FOUND' });
      }

      await folder.restore();

      const childFolders = await FileFolder.find({ parentId: folder._id, userId: req.user._id, isDeleted: true });
      for (const child of childFolders) {
        await child.restore();
      }

      const files = await File.find({ folderId: folder._id, userId: req.user._id, isDeleted: true });
      for (const file of files) {
        await file.restore();
      }

      logger.info(`Folder restored: ${folder.name} by user ${req.user.email}`);
      res.json(folder);
    } catch (error) {
      logger.error('Restore folder error:', error);
      res.status(500).json({ error: 'Failed to restore folder', code: 'RESTORE_FOLDER_ERROR' });
    }
  },

  getAllFolders: async (req, res) => {
    try {
      const folders = await FileFolder.find({ userId: req.user._id, isDeleted: false }).sort({ name: 1 });
      res.json(folders);
    } catch (error) {
      logger.error('Get all folders error:', error);
      res.status(500).json({ error: 'Failed to get all folders', code: 'GET_ALL_FOLDERS_ERROR' });
    }
  }
};

module.exports = folderController;
