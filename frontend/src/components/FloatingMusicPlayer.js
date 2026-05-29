import React from 'react';
import { useMusic } from '../context/MusicContext';
import { useAuth } from '../contexts/AuthContext';

const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const FloatingMusicPlayer = () => {
  const { currentTrack, isPlaying, setIsPlaying, loop, toggleLoop, toggleShuffle, shuffle, progress, duration, seek, playNext, playPrevious, currentPlaylist, currentIndex, playlistQueue, volume, changeVolume } = useMusic();
  const { isAuthenticated } = useAuth();

  if (!currentTrack || !isAuthenticated) return null;

  const handleSeek = (e) => {
    seek(parseFloat(e.target.value));
  };

  const hasQueue = playlistQueue.length > 0;

  return (
    <div className="fixed bottom-4 right-2 sm:bottom-6 sm:right-6 z-50 bg-white dark:bg-gray-900 shadow-2xl border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-3 sm:p-4 flex flex-col items-center w-72 sm:w-80 max-w-[calc(100vw-1rem)] transition-transform hover:scale-105 animate-fade-in">
      {currentPlaylist && (
        <div className="text-xs text-blue-500 truncate w-full text-center mb-1">
          ▶ {currentPlaylist.name}
        </div>
      )}
      <div className="text-sm font-semibold truncate w-full text-center mb-2">
        {currentTrack.title || currentTrack.originalName}
        {currentTrack.artist && <span className="text-gray-500 font-normal ml-1">- {currentTrack.artist}</span>}
      </div>
      <div className="flex gap-1 items-center w-full mb-1">
        <button
          className={`btn btn-secondary font-bold ${shuffle ? 'text-green-500' : ''}`}
          onClick={toggleShuffle}
          title="Shuffle"
          disabled={!hasQueue}
        >
          ⇌
        </button>
        <button
          className="btn btn-secondary"
          onClick={playPrevious}
          disabled={!hasQueue}
          title="Previous"
        >
          ⏮
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => setIsPlaying(!isPlaying)}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>
        <button
          className="btn btn-secondary font-bold"
          onClick={toggleLoop}
          title="Loop"
        >
          <span className={loop ? 'text-cyan-400 font-bold' : ''}>↻</span>
        </button>
        <button
          className="btn btn-secondary"
          onClick={playNext}
          disabled={!hasQueue}
          title="Next"
        >
          ⏭
        </button>
        <input
          type="range"
          min="0"
          max={duration || 1}
          value={progress}
          onChange={handleSeek}
          className="w-full"
        />
        <span className="text-xs w-14 text-right">
          {formatTime(progress)}/{formatTime(duration)}
        </span>
      </div>
      <div className="flex gap-2 items-center w-full px-1">
        <span className="text-base select-none" title="Volume">
          {volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}
        </span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.02"
          value={volume}
          onChange={(e) => changeVolume(parseFloat(e.target.value))}
          className="w-full"
          title={`Volume: ${Math.round(volume * 100)}%`}
        />
        <span className="text-xs w-8 text-right text-gray-500">{Math.round(volume * 100)}%</span>
      </div>
    </div>
  );
};

export default FloatingMusicPlayer;
