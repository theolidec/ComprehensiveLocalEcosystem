import React, { useState } from 'react';
import { useMusic } from '../context/MusicContext';
import { useAuth } from '../contexts/AuthContext';

const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const FloatingMusicPlayer = () => {
  const { currentTrack, isPlaying, setIsPlaying, loop, toggleLoop, toggleShuffle, shuffle, progress, duration, seek, playNext, playPrevious, currentPlaylist, currentIndex, playlistQueue, shuffledQueue, volume, changeVolume, dismissPlayer, userQueue, addToQueue, removeFromQueue, clearQueue } = useMusic();
  const { isAuthenticated } = useAuth();
  const [showQueue, setShowQueue] = useState(false);

  if (!currentTrack || !isAuthenticated) return null;

  const handleSeek = (e) => {
    seek(parseFloat(e.target.value));
  };

  const hasContextQueue = playlistQueue.length > 0;
  const hasNext = playlistQueue.length > 0 || userQueue.length > 0;
  const activeContextQueue = shuffle ? shuffledQueue : playlistQueue;
  const contextUpNext = activeContextQueue.length > 0
    ? activeContextQueue.slice(currentIndex + 1, currentIndex + 6)
    : [];

  return (
    <div className="fixed bottom-4 right-2 sm:bottom-6 sm:right-6 z-50 bg-white dark:bg-gray-900 shadow-2xl border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-3 sm:p-4 flex flex-col items-center w-72 sm:w-80 max-w-[calc(100vw-1rem)] transition-transform hover:scale-105 animate-fade-in">
      <button
        className="absolute top-2 right-2 w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-xs leading-none"
        onClick={dismissPlayer}
        title="Close player"
        aria-label="Close player"
      >
        ✕
      </button>

      {showQueue && (
        <div className="w-full max-h-60 overflow-y-auto mb-3 border-b border-gray-200 dark:border-gray-700 pb-3 pr-6">
          {userQueue.length > 0 && (
            <div className="mb-2">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-semibold text-green-500 uppercase tracking-wide">Next in queue</span>
                <button
                  onClick={clearQueue}
                  className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                  title="Clear queue"
                >
                  Clear all
                </button>
              </div>
              {userQueue.map((track, i) => (
                <div key={i} className="flex items-center gap-1 py-1 px-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 group">
                  <span className="flex-1 text-xs truncate">
                    {track.title || track.originalName}
                    {track.artist && <span className="text-gray-400 ml-1">– {track.artist}</span>}
                  </span>
                  <button
                    onClick={() => removeFromQueue(i)}
                    className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity text-xs ml-1 flex-shrink-0"
                    title="Remove from queue"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
          {contextUpNext.length > 0 && (
            <div>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-1">
                Next from {currentPlaylist?.name || 'library'}
              </span>
              {contextUpNext.map((track, i) => (
                <div key={track._id || i} className="flex items-center gap-1 py-1 px-1 rounded">
                  <span className="flex-1 text-xs truncate text-gray-500">
                    {track.title || track.originalName}
                    {track.artist && <span className="text-gray-400 ml-1">– {track.artist}</span>}
                  </span>
                  <button
                    onClick={() => addToQueue(track)}
                    className="text-gray-300 hover:text-green-500 opacity-0 group-hover:opacity-100 transition-opacity text-xs ml-1 flex-shrink-0"
                    title="Add to queue"
                  >
                    +
                  </button>
                </div>
              ))}
            </div>
          )}
          {userQueue.length === 0 && contextUpNext.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-2">Queue is empty</p>
          )}
        </div>
      )}
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
          disabled={!hasContextQueue}
        >
          ⇌
        </button>
        <button
          className="btn btn-secondary"
          onClick={playPrevious}
          disabled={!hasContextQueue}
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
          disabled={!hasNext}
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
      <button
        onClick={() => setShowQueue(q => !q)}
        className={`mt-2 w-full text-xs py-1 rounded transition-colors ${
          showQueue
            ? 'text-green-500 bg-green-50 dark:bg-green-900/20'
            : 'text-gray-400 hover:text-blue-500 hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
        title="Toggle queue"
      >
        ☰ Queue{userQueue.length > 0 ? ` · ${userQueue.length} in queue` : ''}
      </button>
    </div>
  );
};

export default FloatingMusicPlayer;
