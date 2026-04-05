const express = require('express');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const File = require('../models/File');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

const COLLABORA_URL = process.env.COLLABORA_URL || 'https://localhost:9980';
const WOPI_HOST = process.env.BACKEND_URL || 'http://localhost:3001';
const WOPI_TOKEN_SECRET = process.env.WOPI_TOKEN_SECRET || crypto.randomBytes(32).toString('hex');

const tokenStore = new Map();

const generateWopiToken = (fileId, userId) => {
  const token = crypto.randomBytes(32).toString('hex');
  const expires = Date.now() + 60 * 60 * 1000;
  
  tokenStore.set(token, {
    fileId,
    userId,
    expires
  });
  
  setTimeout(() => tokenStore.delete(token), 60 * 60 * 1000);
  
  return token;
};

const validateWopiToken = (token) => {
  const tokenData = tokenStore.get(token);
  if (!tokenData) return null;
  if (Date.now() > tokenData.expires) {
    tokenStore.delete(token);
    return null;
  }
  return tokenData;
};

router.get('/files/:fileId', async (req, res) => {
  const token = req.query.access_token || req.headers['x-wopi-token'];
  
  if (!token) {
    return res.status(401).json({ error: 'Missing access token' });
  }
  
  const tokenData = validateWopiToken(token);
  if (!tokenData) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  try {
    const file = await File.findOne({ 
      _id: req.params.fileId,
      userId: tokenData.userId
    });
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.json({
      BaseFileName: file.originalName,
      Size: file.size,
      OwnerId: file.userId.toString(),
      UserId: tokenData.userId.toString(),
      UserFriendlyName: tokenData.userId.toString(),
      Version: file.updatedAt?.getTime()?.toString() || '1',
      ReadOnly: false,
      UserCanWrite: true,
      SupportsUpdate: true,
      SupportsLocks: true,
      SupportsDeleteFile: true,
      SupportsRename: true,
      SupportsGetFileWopiUrl: true,
      HostEditUrl: `${WOPI_HOST}/files/edit/${file._id}`,
      HostViewUrl: `${WOPI_HOST}/files/view/${file._id}`
    });
  } catch (error) {
    console.error('WOPI CheckFileInfo error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/files/:fileId/contents', async (req, res) => {
  const token = req.query.access_token || req.headers['x-wopi-token'];
  
  if (!token) {
    return res.status(401).json({ error: 'Missing access token' });
  }
  
  const tokenData = validateWopiToken(token);
  if (!tokenData) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  try {
    const file = await File.findOne({ 
      _id: req.params.fileId,
      userId: tokenData.userId
    });
    
    if (!file || !fs.existsSync(file.path)) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
    
    const stream = fs.createReadStream(file.path);
    stream.pipe(res);
  } catch (error) {
    console.error('WOPI GetFile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/files/:fileId/contents', async (req, res) => {
  const token = req.query.access_token || req.headers['x-wopi-token'];
  
  if (!token) {
    return res.status(401).json({ error: 'Missing access token' });
  }
  
  const tokenData = validateWopiToken(token);
  if (!tokenData) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  try {
    const file = await File.findOne({ 
      _id: req.params.fileId,
      userId: tokenData.userId
    });
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    const tempPath = file.path + '.tmp';
    const writeStream = fs.createWriteStream(tempPath);
    
    req.pipe(writeStream);
    
    writeStream.on('finish', async () => {
      try {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
        fs.renameSync(tempPath, file.path);
        
        const stats = fs.statSync(file.path);
        file.size = stats.size;
        file.markModified('size');
        await file.save();
        
        res.status(200).json({ success: true, size: stats.size });
      } catch (err) {
        console.error('Error saving file:', err);
        res.status(500).json({ error: 'Failed to save file' });
      }
    });
    
    writeStream.on('error', (err) => {
      console.error('Write stream error:', err);
      res.status(500).json({ error: 'Failed to write file' });
    });
  } catch (error) {
    console.error('WOPI PutFile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/files/:fileId/lock', async (req, res) => {
  const token = req.query.access_token || req.headers['x-wopi-token'];
  
  if (!token) {
    return res.status(401).json({ error: 'Missing access token' });
  }
  
  const tokenData = validateWopiToken(token);
  if (!tokenData) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  const { lock } = req.body;
  
  try {
    const file = await File.findOne({ 
      _id: req.params.fileId,
      userId: tokenData.userId
    });
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    file.wopiLock = lock || crypto.randomBytes(16).toString('hex');
    file.wopiLockExpires = Date.now() + 30 * 60 * 1000;
    await file.save();
    
    res.json({ Lock: file.wopiLock });
  } catch (error) {
    console.error('WOPI Lock error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/files/:fileId/unlock', async (req, res) => {
  const token = req.query.access_token || req.headers['x-wopi-token'];
  
  if (!token) {
    return res.status(401).json({ error: 'Missing access token' });
  }
  
  const tokenData = validateWopiToken(token);
  if (!tokenData) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  try {
    const file = await File.findOne({ 
      _id: req.params.fileId,
      userId: tokenData.userId
    });
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    file.wopiLock = null;
    file.wopiLockExpires = null;
    await file.save();
    
    res.json({ success: true });
  } catch (error) {
    console.error('WOPI Unlock error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/files/:fileId/rename', async (req, res) => {
  const token = req.query.access_token || req.headers['x-wopi-token'];
  
  if (!token) {
    return res.status(401).json({ error: 'Missing access token' });
  }
  
  const tokenData = validateWopiToken(token);
  if (!tokenData) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  const { newName } = req.body;
  
  if (!newName) {
    return res.status(400).json({ error: 'New name required' });
  }

  try {
    const file = await File.findOne({ 
      _id: req.params.fileId,
      userId: tokenData.userId
    });
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    const ext = path.extname(file.originalName);
    const newBaseName = path.basename(newName, ext);
    file.originalName = newBaseName + ext;
    await file.save();
    
    res.json({ name: file.originalName });
  } catch (error) {
    console.error('WOPI Rename error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/files/:fileId', async (req, res) => {
  const token = req.query.access_token || req.headers['x-wopi-token'];
  
  if (!token) {
    return res.status(401).json({ error: 'Missing access token' });
  }
  
  const tokenData = validateWopiToken(token);
  if (!tokenData) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  try {
    const file = await File.findOne({ 
      _id: req.params.fileId,
      userId: tokenData.userId
    });
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    await file.softDelete();
    
    res.json({ success: true });
  } catch (error) {
    console.error('WOPI Delete error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/collabora/token/:fileId', authenticateToken, async (req, res) => {
  try {
    const file = await File.findOne({ 
      _id: req.params.fileId,
      userId: req.user._id,
      isDeleted: false
    });
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    const token = generateWopiToken(file._id.toString(), req.user._id.toString());
    
    const wopiSrc = `${WOPI_HOST}/wopi/files/${file._id}?access_token=${token}`;
    
    const actionUrl = `${COLLABORA_URL}/loleaflet/8.4.0/loleaflet.html?WOPISrc=${encodeURIComponent(wopiSrc)}&title=${encodeURIComponent(file.originalName)}&lang=en&closebutton=1&revisionhistory=1`;
    
    res.json({
      token,
      wopiSrc,
      actionUrl,
      editUrl: actionUrl,
      viewUrl: actionUrl.replace('/edit', '/view')
    });
  } catch (error) {
    console.error('Generate Collabora token error:', error);
    res.status(500).json({ error: 'Failed to generate token' });
  }
});

router.get('/discovery', async (req, res) => {
  try {
    const discoveryUrl = `${COLLABORA_URL}/hosting/discovery`;
    const response = await fetch(discoveryUrl);
    const xml = await response.text();
    res.type('application/xml').send(xml);
  } catch (error) {
    console.error('WOPI discovery error:', error);
    res.status(500).json({ error: 'Failed to fetch WOPI discovery' });
  }
});

// Templates for new documents (empty file content)
const templates = {
  word: Buffer.from(''),
  excel: Buffer.from(''),
  powerpoint: Buffer.from(''),
  odt: Buffer.from('')
};

router.post('/create/:type', authenticateToken, async (req, res) => {
  try {
    const { type } = req.params;
    const { folderId, name } = req.body;
    
    const typeMap = {
      word: { ext: 'docx', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
      excel: { ext: 'xlsx', mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
      powerpoint: { ext: 'pptx', mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' },
      odt: { ext: 'odt', mime: 'application/vnd.oasis.opendocument.text' }
    };
    
    if (!typeMap[type]) {
      return res.status(400).json({ error: 'Invalid document type' });
    }
    
    const fileType = typeMap[type];
    const fileName = name || `Untitled.${fileType.ext}`;
    
    // Create uploads directory if needed
    const uploadDir = process.env.UPLOAD_DIR || 'uploads/files';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    // Generate unique filename
    const timestamp = Date.now();
    const uniqueName = `${timestamp}_${crypto.randomBytes(8).toString('hex')}.${fileType.ext}`;
    const filePath = path.join(uploadDir, uniqueName);
    
    // Write empty file (Collabora will create the proper format)
    fs.writeFileSync(filePath, templates[type] || Buffer.from(''));
    
    // Create file record in database
    const file = new File({
      userId: req.user._id,
      filename: uniqueName,
      originalName: fileName,
      mimeType: fileType.mime,
      size: 0,
      path: filePath,
      folderId: folderId || null
    });
    
    await file.save();
    
    // Generate token for immediate editing
    const token = generateWopiToken(file._id.toString(), req.user._id.toString());
    const wopiSrc = `${WOPI_HOST}/wopi/files/${file._id}?access_token=${token}`;
    const actionUrl = `${COLLABORA_URL}/loleaflet/8.4.0/loleaflet.html?WOPISrc=${encodeURIComponent(wopiSrc)}&title=${encodeURIComponent(file.originalName)}&lang=en&closebutton=1&revisionhistory=1`;
    
    res.status(201).json({
      file,
      token,
      actionUrl
    });
  } catch (error) {
    console.error('Create document error:', error);
    res.status(500).json({ error: 'Failed to create document' });
  }
});

module.exports = router;
