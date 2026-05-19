import React, { useRef, useState, useEffect } from 'react';
import axios from 'axios';

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

  useEffect(() => {
    axios.get('/api/music/playlist/my', { withCredentials: true })
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
      
      const res = await axios.post('/api/music/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true,
      });

      if (selectedPlaylist) {
        await axios.post('/api/music/playlist/add', 
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
      <form className="pm-form bg-white dark:bg-gray-900 rounded-xl shadow-md p-4 flex flex-col gap-3">
        <input 
          type="file" 
          accept="audio/*" 
          ref={fileInput} 
          className="pm-input" 
          onChange={handleFileSelect}
        />
        {error && <span className="text-red-500">{error}</span>}
        {success && <span className="text-green-500">{success}</span>}
      </form>

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
