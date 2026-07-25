const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const musicController = require('../controllers/musicController');
const { handleUploadErrors, fileFilterError } = require('../middleware/uploadErrors');

const MUSIC_UPLOAD_DIR = process.env.MUSIC_UPLOAD_DIR || path.join(__dirname, '..', 'uploads', 'music');

if (!fs.existsSync(MUSIC_UPLOAD_DIR)) {
  fs.mkdirSync(MUSIC_UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, MUSIC_UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('audio/')) {
    cb(null, true);
  } else {
    cb(fileFilterError('Only audio files are allowed!'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB
});

// Upload music
router.post('/upload', authenticateToken, upload.single('file'), handleUploadErrors, musicController.uploadMusic);

// Get user's music
router.get('/my', authenticateToken, musicController.getMyMusic);

// Delete music
router.delete('/:id', authenticateToken, musicController.deleteMusic);

// Update music (title, artist)
router.put('/:id', authenticateToken, musicController.updateMusic);

// Toggle music visibility (public/private)
router.put('/:id/visibility', authenticateToken, musicController.toggleVisibility);

// Transfer ownership of music to another user
router.put('/:id/transfer', authenticateToken, musicController.transferOwnership);

// Get public music
router.get('/public', optionalAuth, musicController.getPublicMusic);

// Stream music (public or user-owned)
router.get('/stream/:id', optionalAuth, musicController.streamMusic);

// Playlist endpoints
router.post('/playlist', authenticateToken, musicController.createPlaylist);
router.get('/playlist/my', authenticateToken, musicController.getMyPlaylists);
router.get('/playlist/public', optionalAuth, musicController.getPublicPlaylists);
router.post('/playlist/add', authenticateToken, musicController.addToPlaylist);
router.post('/playlist/remove', authenticateToken, musicController.removeFromPlaylist);
router.delete('/playlist/:id', authenticateToken, musicController.deletePlaylist);

module.exports = router;
