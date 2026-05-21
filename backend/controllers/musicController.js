const Music = require('../models/Music');
const Playlist = require('../models/Playlist');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');
const logger = require('../config/logger');

const ensureUploadDir = (uploadDir) => {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
};

const musicController = {
  uploadMusic: async (req, res) => {
    try {
      const uploadDir = process.env.MUSIC_UPLOAD_DIR || path.join(__dirname, '..', 'uploads', 'music');
      ensureUploadDir(uploadDir);
      if (!req.file) {
        return res.status(400).json({ error: 'No music file uploaded', code: 'NO_FILE' });
      }
      // Validate audio file
      if (!req.file.mimetype.startsWith('audio/')) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ error: 'Invalid file type', code: 'INVALID_TYPE' });
      }
      const { title, artist, album, description, isPublic, tags } = req.body;
      const music = new Music({
        userId: req.user._id,
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
        title: title || req.file.originalname,
        artist: artist || '',
        album: album || '',
        isPublic: isPublic === 'true',
        description: description || '',
        tags: tags ? (Array.isArray(tags) ? tags : [tags]) : []
      });
      await music.save();
      const artistDisplay = music.artist ? music.artist : 'Unknown Artist';
      logger.info(`Music uploaded: ${music.originalName} by ${artistDisplay} (user: ${req.user.email})`);
      res.status(201).json(music);
    } catch (error) {
      logger.error('Music upload error:', error);
      if (req.file && req.file.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ error: 'Music upload failed', code: 'UPLOAD_ERROR' });
    }
  },
  getMyMusic: async (req, res) => {
    try {
      const music = await Music.find({ userId: req.user._id, isDeleted: false });
      res.json(music);
    } catch (error) {
      logger.error('Get music error:', error);
      res.status(500).json({ error: 'Failed to fetch music', code: 'FETCH_ERROR' });
    }
  },
  deleteMusic: async (req, res) => {
    try {
      const music = await Music.findOneAndUpdate(
        { _id: req.params.id, userId: req.user._id, isDeleted: false },
        { isDeleted: true, deletedAt: new Date() },
        { new: true }
      );
      if (!music) return res.status(404).json({ error: 'Music not found', code: 'NOT_FOUND' });
      res.json({ message: 'Music deleted' });
    } catch (error) {
      logger.error('Delete music error:', error);
      res.status(500).json({ error: 'Failed to delete music', code: 'DELETE_ERROR' });
    }
  },
  updateMusic: async (req, res) => {
    try {
      const { title, artist } = req.body;
      const music = await Music.findOne({ _id: req.params.id, userId: req.user._id, isDeleted: false });
      if (!music) return res.status(404).json({ error: 'Music not found', code: 'NOT_FOUND' });
      if (title) music.title = title;
      if (artist !== undefined) music.artist = artist;
      await music.save();
      logger.info(`Music updated: ${music.title} by ${music.artist || 'Unknown'} (user: ${req.user.email})`);
      res.json(music);
    } catch (error) {
      logger.error('Update music error:', error);
      res.status(500).json({ error: 'Failed to update music', code: 'UPDATE_ERROR' });
    }
  },
  toggleVisibility: async (req, res) => {
    try {
      const music = await Music.findOne({ _id: req.params.id, userId: req.user._id, isDeleted: false });
      if (!music) return res.status(404).json({ error: 'Music not found', code: 'NOT_FOUND' });
      music.isPublic = !music.isPublic;
      await music.save();
      res.json(music);
    } catch (error) {
      logger.error('Toggle visibility error:', error);
      res.status(500).json({ error: 'Failed to toggle visibility', code: 'TOGGLE_ERROR' });
    }
  },
  transferOwnership: async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: 'Email is required', code: 'VALIDATION_ERROR' });
      
      const music = await Music.findOne({ _id: req.params.id, userId: req.user._id, isDeleted: false });
      if (!music) return res.status(404).json({ error: 'Music not found', code: 'NOT_FOUND' });
      
      const newOwner = await User.findOne({ email: email.toLowerCase().trim() });
      if (!newOwner) return res.status(404).json({ error: 'User not found', code: 'NOT_FOUND' });
      
      if (String(newOwner._id) === String(req.user._id)) {
        return res.status(400).json({ error: 'Cannot transfer to yourself', code: 'SAME_USER' });
      }
      
      music.userId = newOwner._id;
      await music.save();
      
      logger.info(`Music "${music.title}" transferred from ${req.user.email} to ${newOwner.email}`);
      res.json({ message: 'Ownership transferred successfully', music });
    } catch (error) {
      logger.error('Transfer ownership error:', error);
      res.status(500).json({ error: 'Failed to transfer ownership', code: 'TRANSFER_ERROR' });
    }
  },
  getPublicMusic: async (req, res) => {
    try {
      const music = await Music.find({ isPublic: true, isDeleted: false });
      res.json(music);
    } catch (error) {
      logger.error('Get public music error:', error);
      res.status(500).json({ error: 'Failed to fetch public music', code: 'FETCH_ERROR' });
    }
  },
  streamMusic: async (req, res) => {
    try {
      const music = await Music.findById(req.params.id);
      if (!music || music.isDeleted || (!music.isPublic && (!req.user || String(music.userId) !== String(req.user._id)))) {
        return res.status(404).json({ error: 'Music not found', code: 'NOT_FOUND' });
      }
      const filePath = music.path;
      const stat = fs.statSync(filePath);
      const range = req.headers.range;
      if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
        const chunksize = (end - start) + 1;
        const file = fs.createReadStream(filePath, { start, end });
        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${stat.size}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize,
          'Content-Type': music.mimeType,
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Range'
        });
        file.pipe(res);
      } else {
        res.writeHead(200, {
          'Content-Length': stat.size,
          'Content-Type': music.mimeType,
          'Access-Control-Allow-Origin': '*'
        });
        fs.createReadStream(filePath).pipe(res);
      }
    } catch (error) {
      logger.error('Stream music error:', error);
      res.status(500).json({ error: 'Failed to stream music', code: 'STREAM_ERROR' });
    }
  },
  createPlaylist: async (req, res) => {
    try {
      const { name, description, musicIds, isPublic } = req.body;
      const playlist = new Playlist({
        userId: req.user._id,
        name,
        description: description || '',
        musicIds: musicIds || [],
        isPublic: isPublic === 'true'
      });
      await playlist.save();
      res.status(201).json(playlist);
    } catch (error) {
      logger.error('Create playlist error:', error);
      res.status(500).json({ error: 'Failed to create playlist', code: 'PLAYLIST_ERROR' });
    }
  },
  getMyPlaylists: async (req, res) => {
    try {
      const playlists = await Playlist.find({ userId: req.user._id, isDeleted: false }).populate('musicIds');
      res.json(playlists);
    } catch (error) {
      logger.error('Get playlists error:', error);
      res.status(500).json({ error: 'Failed to fetch playlists', code: 'FETCH_ERROR' });
    }
  },
  getPublicPlaylists: async (req, res) => {
    try {
      const playlists = await Playlist.find({ isPublic: true, isDeleted: false }).populate('musicIds');
      res.json(playlists);
    } catch (error) {
      logger.error('Get public playlists error:', error);
      res.status(500).json({ error: 'Failed to fetch public playlists', code: 'FETCH_ERROR' });
    }
  },
  addToPlaylist: async (req, res) => {
    try {
      const { playlistId, musicId } = req.body;
      const playlist = await Playlist.findOne({ _id: playlistId, userId: req.user._id, isDeleted: false });
      if (!playlist) return res.status(404).json({ error: 'Playlist not found', code: 'NOT_FOUND' });
      if (!playlist.musicIds.includes(musicId)) playlist.musicIds.push(musicId);
      await playlist.save();
      res.json(playlist);
    } catch (error) {
      logger.error('Add to playlist error:', error);
      res.status(500).json({ error: 'Failed to add to playlist', code: 'ADD_ERROR' });
    }
  },
  removeFromPlaylist: async (req, res) => {
    try {
      const { playlistId, musicId } = req.body;
      const playlist = await Playlist.findOne({ _id: playlistId, userId: req.user._id, isDeleted: false });
      if (!playlist) return res.status(404).json({ error: 'Playlist not found', code: 'NOT_FOUND' });
      playlist.musicIds = playlist.musicIds.filter(id => String(id) !== String(musicId));
      await playlist.save();
      res.json(playlist);
    } catch (error) {
      logger.error('Remove from playlist error:', error);
      res.status(500).json({ error: 'Failed to remove from playlist', code: 'REMOVE_ERROR' });
    }
  },
  deletePlaylist: async (req, res) => {
    try {
      const playlist = await Playlist.findOneAndUpdate(
        { _id: req.params.id, userId: req.user._id, isDeleted: false },
        { isDeleted: true, deletedAt: new Date() },
        { new: true }
      );
      if (!playlist) return res.status(404).json({ error: 'Playlist not found', code: 'NOT_FOUND' });
      res.json({ message: 'Playlist deleted' });
    } catch (error) {
      logger.error('Delete playlist error:', error);
      res.status(500).json({ error: 'Failed to delete playlist', code: 'DELETE_ERROR' });
    }
  }
};

module.exports = musicController;
