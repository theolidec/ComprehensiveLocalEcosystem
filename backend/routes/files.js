const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { authenticateToken } = require('../middleware/auth');
const fileController = require('../controllers/fileController');

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '..', 'uploads', 'files');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    // Images
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'image/avif',
    'image/tiff',
    'image/bmp',
    'image/x-icon',
    'image/heic',
    'image/heif',

    // Documents
    'application/pdf',
    'application/msword',                                                            // .doc
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',      // .docx
    'application/vnd.oasis.opendocument.text',                                      // .odt
    'application/rtf',                                                              // .rtf
    'text/plain',                                                                   // .txt
    'text/markdown',                                                                // .md

    // Spreadsheets
    'application/vnd.ms-excel',                                                     // .xls
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',            // .xlsx
    'application/vnd.oasis.opendocument.spreadsheet',                               // .ods
    'text/csv',                                                                     // .csv
    'text/tab-separated-values',                                                    // .tsv

    // Presentations
    'application/vnd.ms-powerpoint',                                                // .ppt
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',    // .pptx
    'application/vnd.oasis.opendocument.presentation',                              // .odp

    // Data & Code
    'application/json',
    'application/xml',
    'text/xml',
    'text/html',
    'text/css',
    'text/javascript',
    'application/javascript',

    // Archives
    'application/zip',
    'application/x-rar-compressed',
    'application/vnd.rar',                                                          // .rar (modern)
    'application/x-7z-compressed',                                                  // .7z
    'application/x-tar',                                                            // .tar
    'application/gzip',                                                             // .gz
    'application/x-bzip2',                                                          // .bz2

    // Audio
    'audio/mpeg',                                                                   // .mp3
    'audio/wav',
    'audio/ogg',
    'audio/aac',                                                                    // .aac
    'audio/flac',                                                                   // .flac
    'audio/webm',                                                                   // .weba
    'audio/x-m4a',                                                                  // .m4a

    // Video
    'video/mp4',
    'video/webm',
    'video/quicktime',                                                              // .mov
    'video/x-msvideo',                                                              // .avi
    'video/x-matroska',                                                             // .mkv
    'video/x-flv',                                                                  // .flv
    'video/mpeg',                                                                   // .mpeg
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('File type not allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 500 * 1024 * 1024
  }
});

router.post('/upload', authenticateToken, upload.single('file'), fileController.uploadFile);

router.get('/', authenticateToken, fileController.getFiles);
router.get('/stats', authenticateToken, fileController.getStorageStats);
router.get('/trash', authenticateToken, fileController.getTrash);

router.get('/shared/:token', fileController.getSharedFile);

router.get('/:id', authenticateToken, fileController.getFile);
router.get('/:id/download', authenticateToken, fileController.downloadFile);
router.get('/:id/stream', authenticateToken, fileController.streamFile);
router.get('/:id/dataurl', authenticateToken, fileController.getFileAsDataUrl);

router.put('/:id', authenticateToken, fileController.updateFile);
router.put('/:id/move', authenticateToken, fileController.moveFile);
router.put('/:id/share', authenticateToken, fileController.shareFile);

router.delete('/:id', authenticateToken, fileController.deleteFile);
router.delete('/:id/permanent', authenticateToken, fileController.deleteFile);
router.post('/:id/restore', authenticateToken, fileController.restoreFile);
router.delete('/trash/empty', authenticateToken, fileController.emptyTrash);

router.post('/create-text', authenticateToken, fileController.createTextFile);
router.get('/:id/content', authenticateToken, fileController.getFileContent);
router.put('/:id/content', authenticateToken, fileController.updateFileContent);

module.exports = router;
