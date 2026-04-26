const File = require('../models/File');
const FileFolder = require('../models/FileFolder');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const logger = require('../config/logger');

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '..', 'uploads', 'files');

const ensureUploadDir = () => {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
};

const fileController = {
  uploadFile: async (req, res) => {
    try {
      ensureUploadDir();
      
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded', code: 'NO_FILE' });
      }

      const { folderId, description, tags } = req.body;
      
      if (folderId) {
        const folder = await FileFolder.findOne({ _id: folderId, userId: req.user._id, isDeleted: false });
        if (!folder) {
          fs.unlinkSync(req.file.path);
          return res.status(400).json({ error: 'Invalid folder', code: 'INVALID_FOLDER' });
        }
      }

      const file = new File({
        userId: req.user._id,
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
        folderId: folderId || null,
        description: description || '',
        tags: tags ? (Array.isArray(tags) ? tags : [tags]) : []
      });

      await file.save();
      logger.info(`File uploaded: ${file.originalName} by user ${req.user.email}`);
      
      res.status(201).json(file);
    } catch (error) {
      logger.error('File upload error:', error);
      if (req.file && req.file.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ error: 'File upload failed', code: 'UPLOAD_ERROR' });
    }
  },

  getFiles: async (req, res) => {
    try {
      const { folderId, search, type, favorite, page = 1, limit = 50 } = req.query;
      
      const query = { userId: req.user._id, isDeleted: false };
      
      if (folderId === 'null' || folderId === '' || folderId === undefined) {
        query.folderId = null;
      } else if (folderId) {
        query.folderId = folderId;
      }
      
      if (search) {
        query.$or = [
          { originalName: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }
      
      if (type) {
        query.mimeType = { $regex: `^${type}` };
      }
      
      if (favorite === 'true') {
        query.isFavorite = true;
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      const files = await File.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));
      
      const total = await File.countDocuments(query);

      res.json({
        files,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      });
    } catch (error) {
      logger.error('Get files error:', error);
      res.status(500).json({ error: 'Failed to get files', code: 'GET_FILES_ERROR' });
    }
  },

  getAllFiles: async (req, res) => {
    try {
      const files = await File.find({ userId: req.user._id, isDeleted: false })
        .sort({ originalName: 1 })
        .limit(1000);
      
      res.json({ files });
    } catch (error) {
      logger.error('Get all files error:', error);
      res.status(500).json({ error: 'Failed to get all files', code: 'GET_ALL_FILES_ERROR' });
    }
  },

  getFile: async (req, res) => {
    try {
      const file = await File.findOne({ _id: req.params.id, userId: req.user._id });
      
      if (!file) {
        return res.status(404).json({ error: 'File not found', code: 'FILE_NOT_FOUND' });
      }

      res.json(file);
    } catch (error) {
      logger.error('Get file error:', error);
      res.status(500).json({ error: 'Failed to get file', code: 'GET_FILE_ERROR' });
    }
  },

  downloadFile: async (req, res) => {
    try {
      const file = await File.findOne({ _id: req.params.id, userId: req.user._id });
      
      if (!file) {
        return res.status(404).json({ error: 'File not found', code: 'FILE_NOT_FOUND' });
      }

      if (!fs.existsSync(file.path)) {
        return res.status(404).json({ error: 'File not found on disk', code: 'FILE_MISSING' });
      }

      res.download(file.path, file.originalName);
    } catch (error) {
      logger.error('Download file error:', error);
      res.status(500).json({ error: 'Failed to download file', code: 'DOWNLOAD_ERROR' });
    }
  },

  streamFile: async (req, res) => {
    try {
      const file = await File.findOne({ _id: req.params.id, userId: req.user._id });
      
      if (!file) {
        return res.status(404).json({ error: 'File not found', code: 'FILE_NOT_FOUND' });
      }

      if (!fs.existsSync(file.path)) {
        return res.status(404).json({ error: 'File not found on disk', code: 'FILE_MISSING' });
      }

      res.setHeader('Content-Type', file.mimeType);
      res.setHeader('Content-Disposition', `inline; filename="${file.originalName}"`);
      
      const stream = fs.createReadStream(file.path);
      stream.pipe(res);
    } catch (error) {
      logger.error('Stream file error:', error);
      res.status(500).json({ error: 'Failed to stream file', code: 'STREAM_ERROR' });
    }
  },

  getFileAsDataUrl: async (req, res) => {
    try {
      const file = await File.findOne({ _id: req.params.id, userId: req.user._id });
      
      if (!file) {
        return res.status(404).json({ error: 'File not found', code: 'FILE_NOT_FOUND' });
      }

      if (!fs.existsSync(file.path)) {
        return res.status(404).json({ error: 'File not found on disk', code: 'FILE_MISSING' });
      }

      const fileBuffer = fs.readFileSync(file.path);
      const base64 = fileBuffer.toString('base64');
      const dataUrl = `data:${file.mimeType};base64,${base64}`;
      
      res.json({ dataUrl, mimeType: file.mimeType });
    } catch (error) {
      logger.error('Get file as data URL error:', error);
      res.status(500).json({ error: 'Failed to get file', code: 'DATA_URL_ERROR' });
    }
  },

  updateFile: async (req, res) => {
    try {
      const { description, tags, isFavorite } = req.body;
      
      const file = await File.findOne({ _id: req.params.id, userId: req.user._id });
      
      if (!file) {
        return res.status(404).json({ error: 'File not found', code: 'FILE_NOT_FOUND' });
      }

      if (description !== undefined) file.description = description;
      if (tags !== undefined) file.tags = Array.isArray(tags) ? tags : [tags];
      if (isFavorite !== undefined) file.isFavorite = isFavorite;

      await file.save();
      logger.info(`File updated: ${file.originalName} by user ${req.user.email}`);
      
      res.json(file);
    } catch (error) {
      logger.error('Update file error:', error);
      res.status(500).json({ error: 'Failed to update file', code: 'UPDATE_ERROR' });
    }
  },

  moveFile: async (req, res) => {
    try {
      const { folderId } = req.body;
      
      if (folderId) {
        const folder = await FileFolder.findOne({ _id: folderId, userId: req.user._id, isDeleted: false });
        if (!folder) {
          return res.status(400).json({ error: 'Invalid folder', code: 'INVALID_FOLDER' });
        }
      }

      const file = await File.findOne({ _id: req.params.id, userId: req.user._id });
      
      if (!file) {
        return res.status(404).json({ error: 'File not found', code: 'FILE_NOT_FOUND' });
      }

      file.folderId = folderId || null;
      await file.save();
      
      res.json(file);
    } catch (error) {
      logger.error('Move file error:', error);
      res.status(500).json({ error: 'Failed to move file', code: 'MOVE_ERROR' });
    }
  },

  deleteFile: async (req, res) => {
    try {
      const { permanent } = req.query;
      
      const file = await File.findOne({ _id: req.params.id, userId: req.user._id });
      
      if (!file) {
        return res.status(404).json({ error: 'File not found', code: 'FILE_NOT_FOUND' });
      }

      if (permanent === 'true') {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
        await File.findByIdAndDelete(file._id);
        logger.info(`File permanently deleted: ${file.originalName} by user ${req.user.email}`);
        res.json({ message: 'File permanently deleted' });
      } else {
        await file.softDelete();
        logger.info(`File moved to trash: ${file.originalName} by user ${req.user.email}`);
        res.json(file);
      }
    } catch (error) {
      logger.error('Delete file error:', error);
      res.status(500).json({ error: 'Failed to delete file', code: 'DELETE_ERROR' });
    }
  },

  restoreFile: async (req, res) => {
    try {
      const file = await File.findOne({ _id: req.params.id, userId: req.user._id, isDeleted: true });
      
      if (!file) {
        return res.status(404).json({ error: 'File not found in trash', code: 'FILE_NOT_FOUND' });
      }

      await file.restore();
      logger.info(`File restored: ${file.originalName} by user ${req.user.email}`);
      
      res.json(file);
    } catch (error) {
      logger.error('Restore file error:', error);
      res.status(500).json({ error: 'Failed to restore file', code: 'RESTORE_ERROR' });
    }
  },

  getTrash: async (req, res) => {
    try {
      const files = await File.getTrash(req.user._id);
      res.json(files);
    } catch (error) {
      logger.error('Get trash error:', error);
      res.status(500).json({ error: 'Failed to get trash', code: 'TRASH_ERROR' });
    }
  },

  emptyTrash: async (req, res) => {
    try {
      const files = await File.getTrash(req.user._id);
      
      for (const file of files) {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
        await File.findByIdAndDelete(file._id);
      }
      
      logger.info(`Trash emptied by user ${req.user.email}`);
      res.json({ message: 'Trash emptied' });
    } catch (error) {
      logger.error('Empty trash error:', error);
      res.status(500).json({ error: 'Failed to empty trash', code: 'EMPTY_TRASH_ERROR' });
    }
  },

  shareFile: async (req, res) => {
    try {
      const { isPublic } = req.body;
      
      const file = await File.findOne({ _id: req.params.id, userId: req.user._id });
      
      if (!file) {
        return res.status(404).json({ error: 'File not found', code: 'FILE_NOT_FOUND' });
      }

      if (isPublic) {
        file.isPublic = true;
        file.shareToken = crypto.randomBytes(32).toString('hex');
        await file.save();
        res.json({ 
          isPublic: file.isPublic, 
          shareUrl: `/files/shared/${file.shareToken}`,
          shareToken: file.shareToken
        });
      } else {
        file.isPublic = false;
        file.shareToken = null;
        await file.save();
        res.json({ isPublic: false });
      }
    } catch (error) {
      logger.error('Share file error:', error);
      res.status(500).json({ error: 'Failed to share file', code: 'SHARE_ERROR' });
    }
  },

  getSharedFile: async (req, res) => {
    try {
      const file = await File.findOne({ shareToken: req.params.token, isPublic: true });
      
      if (!file) {
        return res.status(404).json({ error: 'File not found or not shared', code: 'FILE_NOT_FOUND' });
      }

      if (!fs.existsSync(file.path)) {
        return res.status(404).json({ error: 'File not found on disk', code: 'FILE_MISSING' });
      }

      res.setHeader('Content-Type', file.mimeType);
      res.setHeader('Content-Disposition', `inline; filename="${file.originalName}"`);
      
      const stream = fs.createReadStream(file.path);
      stream.pipe(res);
    } catch (error) {
      logger.error('Get shared file error:', error);
      res.status(500).json({ error: 'Failed to get shared file', code: 'SHARED_FILE_ERROR' });
    }
  },

  getStorageStats: async (req, res) => {
    try {
      const totalSize = await File.aggregate([
        { $match: { userId: req.user._id, isDeleted: false } },
        { $group: { _id: null, total: { $sum: '$size' } } }
      ]);

      const fileCount = await File.countDocuments({ userId: req.user._id, isDeleted: false });
      const folderCount = await FileFolder.countDocuments({ userId: req.user._id, isDeleted: false });
      const trashCount = await File.countDocuments({ userId: req.user._id, isDeleted: true });

      res.json({
        usedStorage: totalSize[0]?.total || 0,
        fileCount,
        folderCount,
        trashCount,
        maxStorage: parseInt(process.env.MAX_STORAGE_BYTES) || 10 * 1024 * 1024 * 1024
      });
    } catch (error) {
      logger.error('Get storage stats error:', error);
      res.status(500).json({ error: 'Failed to get storage stats', code: 'STATS_ERROR' });
    }
  },

  createTextFile: async (req, res) => {
    try {
      const { name, content, folderId, mimeType } = req.body;
      
      if (!name || !name.trim()) {
        return res.status(400).json({ error: 'File name is required', code: 'NO_NAME' });
      }

      if (folderId) {
        const folder = await FileFolder.findOne({ _id: folderId, userId: req.user._id, isDeleted: false });
        if (!folder) {
          return res.status(400).json({ error: 'Invalid folder', code: 'INVALID_FOLDER' });
        }
      }

      ensureUploadDir();

      const fileContent = content || '';
      const fileExt = mimeType === 'text/markdown' ? '.md' : '.txt';
      const originalName = name.endsWith(fileExt) ? name : `${name}${fileExt}`;
      const uniqueSuffix = crypto.randomBytes(16).toString('hex');
      const filename = `${uniqueSuffix}${fileExt}`;
      const filePath = path.join(UPLOAD_DIR, filename);

      fs.writeFileSync(filePath, fileContent);

      const file = new File({
        userId: req.user._id,
        filename,
        originalName,
        mimeType: mimeType || 'text/plain',
        size: Buffer.byteLength(fileContent),
        path: filePath,
        folderId: folderId || null,
        description: '',
        tags: []
      });

      await file.save();
      logger.info(`Text file created: ${file.originalName} by user ${req.user.email}`);
      
      res.status(201).json(file);
    } catch (error) {
      logger.error('Create text file error:', error);
      res.status(500).json({ error: 'Failed to create text file', code: 'CREATE_TEXT_ERROR' });
    }
  },

  getFileContent: async (req, res) => {
    try {
      const file = await File.findOne({ _id: req.params.id, userId: req.user._id });
      
      if (!file) {
        return res.status(404).json({ error: 'File not found', code: 'FILE_NOT_FOUND' });
      }

      if (!fs.existsSync(file.path)) {
        return res.status(404).json({ error: 'File not found on disk', code: 'FILE_MISSING' });
      }

      const content = fs.readFileSync(file.path, 'utf-8');
      
      res.json({ content, mimeType: file.mimeType, originalName: file.originalName });
    } catch (error) {
      logger.error('Get file content error:', error);
      res.status(500).json({ error: 'Failed to get file content', code: 'GET_CONTENT_ERROR' });
    }
  },

  updateFileContent: async (req, res) => {
    try {
      const { content } = req.body;
      
      const file = await File.findOne({ _id: req.params.id, userId: req.user._id });
      
      if (!file) {
        return res.status(404).json({ error: 'File not found', code: 'FILE_NOT_FOUND' });
      }

      if (!fs.existsSync(file.path)) {
        return res.status(404).json({ error: 'File not found on disk', code: 'FILE_MISSING' });
      }

      fs.writeFileSync(file.path, content || '');
      
      file.size = Buffer.byteLength(content || '');
      await file.save();
      
      logger.info(`File content updated: ${file.originalName} by user ${req.user.email}`);
      
      res.json({ success: true, size: file.size });
    } catch (error) {
      logger.error('Update file content error:', error);
      res.status(500).json({ error: 'Failed to update file content', code: 'UPDATE_CONTENT_ERROR' });
    }
  }
};

module.exports = fileController;
