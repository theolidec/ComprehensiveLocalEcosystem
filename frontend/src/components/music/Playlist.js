import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import axios from 'axios';
import { useMusic } from '../../context/MusicContext';

const Playlist = forwardRef(({ onSelectTrack }, ref) => {
  const { currentTrack, currentPlaylist, playTrack, playPlaylist } = useMusic();
  const [playlists, setPlaylists] = useState([]);
  const [music, setMusic] = useState([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddToPlaylistModal, setShowAddToPlaylistModal] = useState(null);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('');
  const [error, setError] = useState('');

  const fetchData = () => {
    axios.get('/api/music/playlist/my', { withCredentials: true })
      .then(res => {
        setPlaylists(res.data);
        if (selectedPlaylist) {
          const updated = res.data.find(p => p._id === selectedPlaylist._id);
          if (updated) setSelectedPlaylist(updated);
        }
      })
      .catch(() => setError('Failed to load playlists'));
    axios.get('/api/music/my', { withCredentials: true })
      .then(res => setMusic(res.data))
      .catch(() => setError('Failed to load music'));
  };

  useImperativeHandle(ref, () => ({
    refresh: fetchData
  }));

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreatePlaylist = async (e) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;
    try {
      await axios.post('/api/music/playlist', {
        name: newPlaylistName.trim(),
        description: newPlaylistDescription.trim()
      }, { withCredentials: true });
      setNewPlaylistName('');
      setNewPlaylistDescription('');
      setShowCreateModal(false);
      fetchData();
    } catch (err) {
      setError('Failed to create playlist');
    }
  };

  const handleDeletePlaylist = async (playlistId) => {
    if (!window.confirm('Delete this playlist?')) return;
    try {
      await axios.delete(`/api/music/playlist/${playlistId}`, { withCredentials: true });
      if (selectedPlaylist?._id === playlistId) setSelectedPlaylist(null);
      fetchData();
    } catch (err) {
      setError('Failed to delete playlist');
    }
  };

  const handleAddToPlaylist = async (playlistId) => {
    const trackId = showAddToPlaylistModal;
    if (!trackId || !playlistId) return;
    try {
      await axios.post('/api/music/playlist/add', { playlistId, musicId: trackId }, { withCredentials: true });
      setShowAddToPlaylistModal(null);
      fetchData();
    } catch (err) {
      setError('Failed to add to playlist');
    }
  };

  const handleRemoveFromPlaylist = async (playlistId, musicId) => {
    try {
      await axios.post('/api/music/playlist/remove', { playlistId, musicId }, { withCredentials: true });
      fetchData();
      if (selectedPlaylist?._id === playlistId) {
        const updated = playlists.find(p => p._id === playlistId);
        if (updated) setSelectedPlaylist({ ...updated, musicIds: updated.musicIds.filter(m => m._id !== musicId) });
      }
    } catch (err) {
      setError('Failed to remove from playlist');
    }
  };

  const handleDeleteMusic = async (musicId) => {
    if (!window.confirm('Are you sure you want to delete this song?')) return;
    try {
      await axios.delete(`/api/music/${musicId}`, { withCredentials: true });
      fetchData();
    } catch (err) {
      setError('Failed to delete song');
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Your Playlists</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          + New Playlist
        </button>
      </div>

      {playlists.length === 0 ? (
        <p className="text-gray-500">No playlists yet. Create one to get started!</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {playlists.map(pl => {
            const isPlaying = currentPlaylist?._id === pl._id;
            return (
              <div
                key={pl._id}
                onClick={() => setSelectedPlaylist(pl)}
                className={`p-4 rounded-lg cursor-pointer transition-all relative ${
                  selectedPlaylist?._id === pl._id 
                    ? 'bg-blue-100 dark:bg-blue-900 ring-2 ring-blue-500' 
                    : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                } ${isPlaying ? 'ring-2 ring-green-500' : ''}`}
              >
                {isPlaying && (
                  <div className="absolute top-2 right-2 text-green-500">▶</div>
                )}
                <div className="font-semibold truncate">{pl.name}</div>
                <div className="text-sm text-gray-500">{pl.musicIds?.length || 0} songs</div>
              </div>
            );
          })}
        </div>
      )}

      {selectedPlaylist && (
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">{selectedPlaylist.name}</h3>
              {currentPlaylist?._id === selectedPlaylist._id && (
                <span className="text-green-500">▶ Playing</span>
              )}
            </div>
            <div className="flex gap-2">
              {selectedPlaylist.musicIds?.length > 0 && (
                <button
                  onClick={() => playPlaylist(selectedPlaylist)}
                  className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
                >
                  ▶ Play All
                </button>
              )}
              <button
                onClick={() => handleDeletePlaylist(selectedPlaylist._id)}
                className="text-red-500 hover:text-red-700 text-sm"
              >
                Delete Playlist
              </button>
            </div>
          </div>
          {selectedPlaylist.description && (
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{selectedPlaylist.description}</p>
          )}
          {selectedPlaylist.musicIds?.length === 0 ? (
            <p className="text-gray-500">No songs in this playlist.</p>
          ) : (
            <ul className="space-y-2">
              {selectedPlaylist.musicIds?.map((track, idx) => {
                const isCurrentlyPlaying = currentTrack?._id === track._id;
                return (
                  <li key={track._id} className={`flex justify-between items-center bg-white dark:bg-gray-700 p-2 rounded ${isCurrentlyPlaying ? 'ring-2 ring-green-500' : ''}`}>
                    <div className="flex items-center gap-2 flex-1">
                      {isCurrentlyPlaying && <span className="text-green-500">▶</span>}
                      <button 
                        className="flex-1 text-left hover:text-blue-500 truncate"
                        onClick={() => playTrack(track, selectedPlaylist, selectedPlaylist.musicIds)}
                      >
                        {track.title || track.originalName}
                      </button>
                    </div>
                    <button
                      onClick={() => handleRemoveFromPlaylist(selectedPlaylist._id, track._id)}
                      className="ml-2 text-gray-400 hover:text-red-500"
                      title="Remove from playlist"
                    >
                      ✕
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      <div className="mt-6">
        <h2 className="text-xl font-bold mb-4">All Your Music</h2>
        {music.length === 0 ? (
          <p className="text-gray-500">No music uploaded yet.</p>
        ) : (
          <ul className="space-y-2">
            {music.map(track => (
              <li key={track._id} className="flex justify-between items-center bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm">
                <button 
                  className="flex-1 text-left hover:text-blue-500 truncate"
                  onClick={() => onSelectTrack(track)}
                >
                  <span className="font-medium">{track.title || track.originalName}</span>
                  {track.artist && <span className="text-gray-500 ml-2">- {track.artist}</span>}
                </button>
                <button
                  onClick={() => setShowAddToPlaylistModal(track._id)}
                  className="ml-2 px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded hover:bg-blue-500 hover:text-white transition-colors"
                >
                  + Add to Playlist
                </button>
                <button
                  onClick={() => handleDeleteMusic(track._id)}
                  className="ml-2 px-3 py-1 text-sm bg-red-200 dark:bg-red-800 text-red-700 dark:text-red-300 rounded hover:bg-red-500 hover:text-white transition-colors"
                  title="Delete song"
                >
                  🗑
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {error && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg">
          {error}
          <button onClick={() => setError('')} className="ml-2 font-bold">✕</button>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Create New Playlist</h3>
            <form onSubmit={handleCreatePlaylist}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                  placeholder="My Playlist"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Description (optional)</label>
                <textarea
                  value={newPlaylistDescription}
                  onChange={(e) => setNewPlaylistDescription(e.target.value)}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                  placeholder="Playlist description..."
                  rows={2}
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddToPlaylistModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Add to Playlist</h3>
            {playlists.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-gray-500 mb-4">No playlists yet. Create one first!</p>
                <button
                  onClick={() => { setShowAddToPlaylistModal(null); setShowCreateModal(true); }}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Create Playlist
                </button>
              </div>
            ) : (
              <ul className="space-y-2 max-h-60 overflow-y-auto">
                {playlists.map(pl => (
                  <li key={pl._id}>
                    <button
                      onClick={() => handleAddToPlaylist(pl._id)}
                      className="w-full text-left p-3 rounded hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
                    >
                      <div className="font-medium">{pl.name}</div>
                      <div className="text-sm text-gray-500">{pl.musicIds?.length || 0} songs</div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowAddToPlaylistModal(null)}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default Playlist;
