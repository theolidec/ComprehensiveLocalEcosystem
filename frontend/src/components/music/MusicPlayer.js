import React, { useRef, useState, useEffect } from 'react';

const MusicPlayer = ({ track, onPlay, onPause, isPlaying, onEnded }) => {
  const audioRef = useRef();
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (audioRef.current && isPlaying) {
      audioRef.current.play();
    } else if (audioRef.current) {
      audioRef.current.pause();
    }
  }, [isPlaying, track]);

  const handleTimeUpdate = () => {
    setProgress(audioRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    setDuration(audioRef.current.duration);
  };

  const handleSeek = (e) => {
    const time = parseFloat(e.target.value);
    audioRef.current.currentTime = time;
    setProgress(time);
  };

  return (
    <div className="w-full flex flex-col items-center p-2">
      <audio
        ref={audioRef}
        src={track ? `/api/music/stream/${track._id}` : null}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={onEnded}
        preload="auto"
      />
      <div className="text-lg font-semibold">{track?.title || track?.originalName || 'No Track Selected'}</div>
      <div className="flex gap-2 items-center w-full max-w-md">
        <button
          className="btn btn-secondary"
          onClick={isPlaying ? onPause : onPlay}
          disabled={!track}
        >
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        <input
          type="range"
          min="0"
          max={duration || 1}
          value={progress}
          onChange={handleSeek}
          className="w-full"
          disabled={!track}
        />
        <span className="text-xs w-16 text-right">
          {Math.floor(progress)}/{Math.floor(duration)}s
        </span>
      </div>
    </div>
  );
};

export default MusicPlayer;
