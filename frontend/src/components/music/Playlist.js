import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import axios from 'axios';
import { useMusic } from '../../context/MusicContext';

const Playlist = forwardRef(({ onSelectTrack, compactMode = false, initialShowPublic = false }, ref) => {
  const { currentTrack, currentPlaylist, playTrack, playPlaylist } = useMusic();
  const [playlists, setPlaylists] = useState([]);
  const [music, setMusic] = useState([]);
  const [publicMusic, setPublicMusic] = useState([]);
  const [showPublicMusic, setShowPublicMusic] = useState(initialShowPublic);
  const [showMyMusic, setShowMyMusic] = useState(!initialShowPublic);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddToPlaylistModal, setShowAddToPlaylistModal] = useState(null);
  const [showTransferModal, setShowTransferModal] = useState(null);
  const [transferEmail, setTransferEmail] = useState('');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('');
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSongs, setSelectedSongs] = useState(new Set());

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
    axios.get('/api/music/public', { withCredentials: true })
      .then(res => setPublicMusic(res.data))
      .catch(() => {});
  };

  const handleToggleVisibility = async (musicId) => {
    try {
      await axios.put(`/api/music/${musicId}/visibility`, {}, { withCredentials: true });
      fetchData();
    } catch (err) {
      setError('Failed to toggle visibility');
    }
  };

  useImperativeHandle(ref, () => ({
    refresh: fetchData
  }));

  useEffect(() => {
    fetchData();
  }, []);

  // Debounced user search for transfer modal
  useEffect(() => {
    if (!showTransferModal) {
      setUserSearchQuery('');
      setUserSearchResults([]);
      return;
    }
    const timer = setTimeout(() => {
      if (userSearchQuery.length >= 2) {
        setUserSearchLoading(true);
        axios.get('/api/follow/search', { params: { q: userSearchQuery }, withCredentials: true })
          .then(res => setUserSearchResults(res.data.users || []))
          .catch(() => setUserSearchResults([]))
          .finally(() => setUserSearchLoading(false));
      } else {
        setUserSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [userSearchQuery, showTransferModal]);

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

  const handleTransferOwnership = async (e) => {
    e.preventDefault();
    if (!transferEmail.trim()) return;
    try {
      const songIds = Array.from(selectedSongs);
      for (const id of songIds) {
        await axios.put(`/api/music/${id}/transfer`, { email: transferEmail }, { withCredentials: true });
      }
      setShowTransferModal(null);
      setTransferEmail('');
      setSelectedSongs(new Set());
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to transfer ownership');
    }
  };

  const toggleSongSelection = (songId) => {
    setSelectedSongs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(songId)) {
        newSet.delete(songId);
      } else {
        newSet.add(songId);
      }
      return newSet;
    });
  };

  const selectAllSongs = () => {
    if (selectedSongs.size === filteredMusic.length) {
      setSelectedSongs(new Set());
    } else {
      setSelectedSongs(new Set(filteredMusic.map(t => t._id)));
    }
  };

  const handleBulkVisibility = async (makePublic) => {
    try {
      const songIds = Array.from(selectedSongs);
      for (const id of songIds) {
        const song = music.find(m => m._id === id);
        if (song && song.isPublic !== makePublic) {
          await axios.put(`/api/music/${id}/visibility`, {}, { withCredentials: true });
        }
      }
      setSelectedSongs(new Set());
      fetchData();
    } catch (err) {
      setError('Failed to update visibility');
    }
  };

  const handleBulkAddToPlaylist = async (playlistId) => {
    try {
      const songIds = Array.from(selectedSongs);
      for (const musicId of songIds) {
        await axios.post('/api/music/playlist/add', { playlistId, musicId }, { withCredentials: true });
      }
      setShowAddToPlaylistModal('bulk');
      setSelectedSongs(new Set());
      fetchData();
    } catch (err) {
      setError('Failed to add to playlist');
    }
  };

  const filteredMusic = music.filter(track => {
    const query = searchQuery.toLowerCase();
    return (track.title || '').toLowerCase().includes(query) || 
           (track.artist || '').toLowerCase().includes(query) ||
           (track.originalName || '').toLowerCase().includes(query);
  });

  const filteredPublicMusic = publicMusic.filter(track => {
    const query = searchQuery.toLowerCase();
    return (track.title || '').toLowerCase().includes(query) || 
           (track.artist || '').toLowerCase().includes(query) ||
           (track.originalName || '').toLowerCase().includes(query);
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search songs..."
          className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
        />
      </div>
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
                onClick={() => setSelectedPlaylist(selectedPlaylist?._id === pl._id ? null : pl)}
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
        <button
          onClick={() => setShowMyMusic(!showMyMusic)}
          className="text-xl font-bold mb-4 flex items-center gap-2 hover:text-blue-500 transition-colors"
        >
          <span>{showMyMusic ? '▼' : '▶'}</span>
          <span>🎵 All Your Music</span>
          <span className="text-sm font-normal text-gray-500">
            {searchQuery ? `(${filteredMusic.length}/${music.length})` : `(${music.length})`}
          </span>
        </button>
        {showMyMusic && (
          music.length === 0 ? (
            <p className="text-gray-500">No music uploaded yet.</p>
          ) : filteredMusic.length === 0 ? (
            <p className="text-gray-500">No songs match your search.</p>
          ) : (
            <>
              {selectedSongs.size > 0 && (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900 rounded-lg flex flex-wrap items-center gap-2">
                  <span className="font-medium">{selectedSongs.size} selected</span>
                  <button
                    onClick={() => handleBulkVisibility(true)}
                    className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    Make Public
                  </button>
                  <button
                    onClick={() => handleBulkVisibility(false)}
                    className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
                  >
                    Make Private
                  </button>
                  <button
                    onClick={() => setShowAddToPlaylistModal('bulk')}
                    className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Add to Playlist
                  </button>
                  <button
                    onClick={() => setShowTransferModal('bulk')}
                    className="px-3 py-1 text-sm bg-purple-500 text-white rounded hover:bg-purple-600"
                  >
                    Transfer
                  </button>
                  <button
                    onClick={() => setSelectedSongs(new Set())}
                    className="px-3 py-1 text-sm bg-gray-300 dark:bg-gray-600 rounded hover:bg-gray-400"
                  >
                    Clear
                  </button>
                </div>
              )}
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  checked={selectedSongs.size > 0 && selectedSongs.size === filteredMusic.length}
                  onChange={selectAllSongs}
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-500">Select all</span>
              </div>
              <ul className="space-y-2">
                {filteredMusic.map(track => (
                  <li key={track._id} className={`flex justify-between items-center bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm ${selectedSongs.has(track._id) ? 'ring-2 ring-blue-500' : ''}`}>
                    <input
                      type="checkbox"
                      checked={selectedSongs.has(track._id)}
                      onChange={() => toggleSongSelection(track._id)}
                      className="w-4 h-4 mr-3"
                    />
                    <button 
                      className="flex-1 text-left hover:text-blue-500 truncate"
                      onClick={() => onSelectTrack(track)}
                    >
                      <span className="font-medium">{track.title || track.originalName}</span>
                      {track.artist && <span className="text-gray-500 ml-2">- {track.artist}</span>}
                      <span className={`ml-2 text-xs px-2 py-0.5 rounded ${track.isPublic ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-300'}`}>
                        {track.isPublic ? '🔓 Public' : '🔒 Private'}
                      </span>
                    </button>
                    <button
                    onClick={() => handleToggleVisibility(track._id)}
                    className="ml-2 px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded hover:bg-yellow-500 hover:text-white transition-colors"
                    title={track.isPublic ? 'Make private' : 'Make public'}
                  >
                    {track.isPublic ? '🔒' : '🔓'}
                  </button>
                  <button
                    onClick={() => setShowTransferModal(track._id)}
                    className="ml-2 px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded hover:bg-purple-500 hover:text-white transition-colors"
                    title="Transfer ownership"
                  >
                    📤
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
            </>
          )
        )}
      </div>

      <div className="mt-6">
        <button
          onClick={() => setShowPublicMusic(!showPublicMusic)}
          className="text-xl font-bold mb-4 flex items-center gap-2 hover:text-blue-500 transition-colors"
        >
          <span>{showPublicMusic ? '▼' : '▶'}</span>
          <span>🌍 Public Music</span>
          <span className="text-sm font-normal text-gray-500">
            {searchQuery ? `(${filteredPublicMusic.length}/${publicMusic.length})` : `(${publicMusic.length})`}
          </span>
        </button>
        {showPublicMusic && (
          publicMusic.length === 0 ? (
            <p className="text-gray-500">No public music available yet.</p>
          ) : filteredPublicMusic.length === 0 ? (
            <p className="text-gray-500">No songs match your search.</p>
          ) : (
            <ul className="space-y-2">
              {filteredPublicMusic.map(track => (
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
                </li>
              ))}
            </ul>
          )
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
            <h3 className="text-lg font-bold mb-4">
              {showAddToPlaylistModal === 'bulk' ? `Add ${selectedSongs.size} Songs to Playlist` : 'Add to Playlist'}
            </h3>
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
                      onClick={() => showAddToPlaylistModal === 'bulk' ? handleBulkAddToPlaylist(pl._id) : handleAddToPlaylist(pl._id)}
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
                onClick={() => { setShowAddToPlaylistModal(null); if (showAddToPlaylistModal === 'bulk') setSelectedSongs(new Set()); }}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showTransferModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">
              {showTransferModal === 'bulk' ? `Transfer ${selectedSongs.size} Songs` : 'Transfer Ownership'}
            </h3>
            <form onSubmit={handleTransferOwnership}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Search User</label>
                <input
                  type="text"
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                  placeholder="Search by name or email..."
                />
                {userSearchLoading && (
                  <p className="text-xs text-gray-500 mt-1">Searching...</p>
                )}
                {userSearchResults.length > 0 && (
                  <ul className="mt-2 border rounded max-h-40 overflow-y-auto">
                    {userSearchResults.map(user => (
                      <li key={user._id}>
                        <button
                          type="button"
                          onClick={() => { setTransferEmail(user.email); setUserSearchQuery(user.name || user.email); setUserSearchResults([]); }}
                          className="w-full text-left p-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                        >
                          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm">
                            {(user.name || user.email)[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium">{user.name || 'No name'}</div>
                            <div className="text-xs text-gray-500">{user.email}</div>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {!userSearchLoading && userSearchQuery.length >= 2 && userSearchResults.length === 0 && (
                  <p className="text-xs text-gray-500 mt-1">No users found</p>
                )}
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Or enter email directly</label>
                <input
                  type="email"
                  value={transferEmail}
                  onChange={(e) => setTransferEmail(e.target.value)}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                  placeholder="user@example.com"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setShowTransferModal(null); setTransferEmail(''); setUserSearchQuery(''); setUserSearchResults([]); if (showTransferModal === 'bulk') setSelectedSongs(new Set()); }}
                  className="px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!transferEmail.trim()}
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
});

export default Playlist;
