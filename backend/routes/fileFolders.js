const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const folderController = require('../controllers/fileFolderController');

router.post('/', authenticateToken, folderController.createFolder);
router.get('/', authenticateToken, folderController.getFolders);
router.get('/all', authenticateToken, folderController.getAllFolders);
router.get('/path/:id', authenticateToken, folderController.getFolderPath);

router.get('/:id', authenticateToken, folderController.getFolder);
router.put('/:id', authenticateToken, folderController.updateFolder);
router.put('/:id/move', authenticateToken, folderController.moveFolder);
router.delete('/:id', authenticateToken, folderController.deleteFolder);
router.delete('/:id/permanent', authenticateToken, folderController.deleteFolder);
router.post('/:id/restore', authenticateToken, folderController.restoreFolder);

module.exports = router;
