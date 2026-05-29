import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useMusic } from '../../context/MusicContext';
import Header from '../Layout/Header';
import Footer from '../Layout/Footer';
import MusicUpload from '../music/MusicUpload';
import Playlist from '../music/Playlist';

const MusicPage = ({ tab }) => {
  const { playlistRef, playTrack, refreshPlaylists } = useMusic();
  const navigate = useNavigate();
  const location = useLocation();
  const { artistName } = useParams();
  const [activeTab, setActiveTab] = useState(tab || 'library');

  useEffect(() => {
    if (tab) {
      setActiveTab(tab);
    }
  }, [tab]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    navigate(`/music/${tabId}`);
  };

  const handleUpload = () => {
    refreshPlaylists();
  };

  const tabs = [
    { id: 'library', label: 'My Library', icon: '🎵' },
    { id: 'artists', label: 'Artists', icon: '👤' },
    { id: 'upload', label: 'Upload', icon: '⬆️' },
    { id: 'discover', label: 'Discover', icon: '🌍' },
  ];

  return (
    <>
      <Header />
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <div className="music-hero-gradient p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-10 rounded-full translate-y-1/2 -translate-x-1/2"></div>
          <div className="relative z-10">
            <h1 className="text-4xl font-bold text-white mb-2 drop-shadow-lg">Music</h1>
          </div>
        </div>

        <div className="px-6 pt-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`px-5 py-3 font-medium transition-all duration-300 whitespace-nowrap relative ${
                    activeTab === tab.id
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                  {activeTab === tab.id && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500"></span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 pb-8">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'upload' && (
              <div className="animate-fade-in mt-6">
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-6 border border-blue-100 dark:border-blue-800">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <span className="text-2xl">⬆️</span> Upload New Track
                  </h2>
                  <MusicUpload onUpload={handleUpload} />
                </div>
              </div>
            )}

            {(activeTab === 'library' || activeTab === 'playlists') && (
              <div className="animate-fade-in mt-6">
                <Playlist
                  ref={playlistRef}
                  onSelectTrack={track => playTrack(track)}
                  compactMode={activeTab === 'library'}
                />
              </div>
            )}

            {activeTab === 'discover' && (
              <div className="animate-fade-in mt-6">
                <Playlist
                  ref={playlistRef}
                  onSelectTrack={track => playTrack(track)}
                  initialShowPublic={true}
                />
              </div>
            )}

            {activeTab === 'artists' && (
              <div className="animate-fade-in mt-6">
                <Playlist
                  key="artists"
                  ref={playlistRef}
                  onSelectTrack={track => playTrack(track)}
                  showArtistsOnly={true}
                  initialArtist={artistName ? decodeURIComponent(artistName) : null}
                />
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default MusicPage;
