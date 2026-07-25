const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { body, param, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const fileController = require('../controllers/fileController');
const { handleUploadErrors, fileFilterError } = require('../middleware/uploadErrors');
const logger = require('../config/logger');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn('File validation errors:', errors.array());
    return res.status(400).json({
      errors: errors.array(),
      code: 'VALIDATION_ERROR'
    });
  }
  next();
};

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
    cb(fileFilterError('File type not allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 500 * 1024 * 1024
  }
});

router.post('/upload', authenticateToken, upload.single('file'), handleUploadErrors, fileController.uploadFile);

router.post('/document-image', authenticateToken, upload.single('image'), handleUploadErrors, fileController.uploadDocumentImage);
router.get('/document-images/:filename', authenticateToken, [
  param('filename').matches(/^[a-f0-9]{32}\.[a-zA-Z0-9]{1,8}$/).withMessage('Invalid filename')
], handleValidationErrors, fileController.serveDocumentImage);

router.get('/', authenticateToken, fileController.getFiles);
router.get('/all', authenticateToken, fileController.getAllFiles);
router.get('/stats', authenticateToken, fileController.getStorageStats);
router.get('/trash', authenticateToken, fileController.getTrash);

router.get('/shared/:token', fileController.getSharedFile);

router.get('/:id', authenticateToken, [
  param('id').isMongoId().withMessage('Invalid file ID')
], handleValidationErrors, fileController.getFile);

router.get('/:id/download', authenticateToken, [
  param('id').isMongoId().withMessage('Invalid file ID')
], handleValidationErrors, fileController.downloadFile);

router.get('/:id/stream', authenticateToken, [
  param('id').isMongoId().withMessage('Invalid file ID')
], handleValidationErrors, fileController.streamFile);

router.get('/:id/dataurl', authenticateToken, [
  param('id').isMongoId().withMessage('Invalid file ID')
], handleValidationErrors, fileController.getFileAsDataUrl);

router.put('/:id', authenticateToken, [
  param('id').isMongoId().withMessage('Invalid file ID'),
  body('description').optional().trim().isLength({ max: 1000 }),
  body('tags').optional().isArray(),
  body('isFavorite').optional().isBoolean()
], handleValidationErrors, fileController.updateFile);

router.put('/:id/move', authenticateToken, [
  param('id').isMongoId().withMessage('Invalid file ID'),
  body('folderId').optional().isMongoId().withMessage('Invalid folder ID')
], handleValidationErrors, fileController.moveFile);

router.put('/:id/share', authenticateToken, [
  param('id').isMongoId().withMessage('Invalid file ID'),
  body('isPublic').isBoolean().withMessage('isPublic must be a boolean')
], handleValidationErrors, fileController.shareFile);

router.delete('/:id', authenticateToken, [
  param('id').isMongoId().withMessage('Invalid file ID')
], handleValidationErrors, fileController.deleteFile);

router.delete('/:id/permanent', authenticateToken, [
  param('id').isMongoId().withMessage('Invalid file ID')
], handleValidationErrors, fileController.permanentDeleteFile);

router.post('/:id/restore', authenticateToken, [
  param('id').isMongoId().withMessage('Invalid file ID')
], handleValidationErrors, fileController.restoreFile);

router.delete('/trash/empty', authenticateToken, fileController.emptyTrash);

router.post('/create-text', authenticateToken, [
  body('name').trim().notEmpty().withMessage('File name is required').isLength({ max: 255 }),
  body('content').optional().isString(),
  body('folderId').optional({ values: 'falsy' }).isMongoId().withMessage('Invalid folder ID'),
  body('mimeType').optional().isString()
], handleValidationErrors, fileController.createTextFile);

router.get('/:id/content', authenticateToken, [
  param('id').isMongoId().withMessage('Invalid file ID')
], handleValidationErrors, fileController.getFileContent);

router.put('/:id/content', authenticateToken, [
  param('id').isMongoId().withMessage('Invalid file ID'),
  body('content').optional().isString()
], handleValidationErrors, fileController.updateFileContent);

router.get('/:id/versions', authenticateToken, [
  param('id').isMongoId().withMessage('Invalid file ID')
], handleValidationErrors, fileController.getDocumentVersions);

router.get('/:id/versions/:versionId', authenticateToken, [
  param('id').isMongoId().withMessage('Invalid file ID'),
  param('versionId').isMongoId().withMessage('Invalid version ID')
], handleValidationErrors, fileController.getDocumentVersion);

module.exports = router;
