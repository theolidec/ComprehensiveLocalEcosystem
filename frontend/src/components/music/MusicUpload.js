import React, { useRef, useState, useEffect } from 'react';
import api from '../../utils/fetchClient';

const MusicUpload = ({ onUpload }) => {
  const fileInput = useRef();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [songName, setSongName] = useState('');
  const [artist, setArtist] = useState('');
  const [selectedPlaylist, setSelectedPlaylist] = useState('');
  const [playlists, setPlaylists] = useState([]);
  const [isPublic, setIsPublic] = useState(false);

  useEffect(() => {
    api.get('/api/music/playlist/my', { withCredentials: true })
      .then(res => setPlaylists(res.data))
      .catch(() => {});
  }, []);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('audio/')) {
      setSelectedFile(file);
      setSongName(file.name.replace(/\.[^/.]+$/, ''));
      setShowModal(true);
      setError('');
      setSuccess('');
    } else {
      setError('Only audio files are allowed.');
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;
    
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('title', songName || selectedFile.name);
      formData.append('artist', artist);
      formData.append('isPublic', isPublic);
      
      const res = await api.post('/api/music/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true,
      });

      if (selectedPlaylist) {
        await api.post('/api/music/playlist/add', 
          { playlistId: selectedPlaylist, musicId: res.data._id },
          { withCredentials: true }
        );
      }

      setSuccess('Upload successful!');
      setShowModal(false);
      setSelectedFile(null);
      setSongName('');
      setArtist('');
      setSelectedPlaylist('');
      setIsPublic(false);
      if (fileInput.current) fileInput.current.value = '';
      if (onUpload) onUpload(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setShowModal(false);
    setSelectedFile(null);
    if (fileInput.current) fileInput.current.value = '';
  };

  return (
    <>
      <div 
        onClick={() => fileInput.current?.click()}
        className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-300 group"
      >
        <input 
          type="file" 
          accept="audio/*" 
          ref={fileInput} 
          className="hidden" 
          onChange={handleFileSelect}
        />
        <div className="text-5xl mb-3 group-hover:scale-110 transition-transform duration-300">🎧</div>
        <p className="text-gray-600 dark:text-gray-400 font-medium">
          Click to select an audio file
        </p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
          MP3, WAV, FLAC, M4A supported
        </p>
        {error && <span className="text-red-500 block mt-2">{error}</span>}
        {success && <span className="text-green-500 block mt-2">{success}</span>}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Song Details</h3>
            <form onSubmit={handleUpload}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Song Name</label>
                <input
                  type="text"
                  value={songName}
                  onChange={(e) => setSongName(e.target.value)}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                  placeholder="Song name"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Artist</label>
                <input
                  type="text"
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                  placeholder="Artist name"
                />
              </div>
              <div className="mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium">Make this song public</span>
                </label>
                <p className="text-xs text-gray-500 mt-1 ml-6">Public songs can be discovered and played by anyone</p>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Add to Playlist (optional)</label>
                <select
                  value={selectedPlaylist}
                  onChange={(e) => setSelectedPlaylist(e.target.value)}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                >
                  <option value="">No playlist</option>
                  {playlists.map(pl => (
                    <option key={pl._id} value={pl._id}>{pl.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded hover:bg-gray-400"
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  disabled={uploading}
                >
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default MusicUpload;
