import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';

const MusicContext = createContext();

const COOKIE_NAME = 'musicState';
const COOKIE_MAX_AGE = 24 * 60 * 60;

const setCookie = (value) => {
  const encoded = encodeURIComponent(JSON.stringify(value));
  document.cookie = `${COOKIE_NAME}=${encoded}; max-age=${COOKIE_MAX_AGE}; path=/; SameSite=Lax`;
};

const getCookie = () => {
  const match = document.cookie.match(new RegExp(`(^| )${COOKIE_NAME}=([^;]+)`));
  if (match) {
    try {
      return JSON.parse(decodeURIComponent(match[2]));
    } catch {
      return null;
    }
  }
  return null;
};

let globalAudio = null;

export const MusicProvider = ({ children }) => {
  const storedState = getCookie();
  
  const [currentTrack, setCurrentTrack] = useState(storedState?.track || null);
  const [isPlaying, setIsPlaying] = useState(storedState?.isPlaying || false);
  const [loop, setLoop] = useState(storedState?.loop || false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentPlaylist, setCurrentPlaylist] = useState(storedState?.currentPlaylist || null);
  const [playlistQueue, setPlaylistQueue] = useState(storedState?.playlistQueue || []);
  const [currentIndex, setCurrentIndex] = useState(storedState?.currentIndex ?? -1);
  const [shuffle, setShuffle] = useState(storedState?.shuffle || false);
  const [volume, setVolume] = useState(storedState?.volume ?? 1);
  const [shuffledQueue, setShuffledQueue] = useState(storedState?.shuffledQueue || []);
  const [userQueue, setUserQueue] = useState(storedState?.userQueue || []);

  const playlistRef = useRef(null);
  const audioRef = useRef(null);
  const volumeRef = useRef(storedState?.volume ?? 1);
  const savedProgress = useRef(storedState?.progress || 0);
  const isRestored = useRef(false);
  const loopRef = useRef(storedState?.loop || false);
  const isPlayingRef = useRef(storedState?.isPlaying || false);
  const autoAdvancingRef = useRef(false);
  const isInitialMountRef = useRef(true);
  const shuffleRef = useRef(storedState?.shuffle || false);
  const currentIndexRef = useRef(storedState?.currentIndex ?? -1);
  const playlistQueueRef = useRef(storedState?.playlistQueue || []);
  const shuffledQueueRef = useRef(storedState?.shuffledQueue || []);
  const queueRef = useRef(storedState?.playlistQueue || []);
  const userQueueRef = useRef(storedState?.userQueue || []);

  useEffect(() => {
    playlistQueueRef.current = playlistQueue;
    if (!shuffleRef.current) queueRef.current = playlistQueue;
  }, [playlistQueue]);

  useEffect(() => {
    shuffledQueueRef.current = shuffledQueue;
    if (shuffleRef.current) queueRef.current = shuffledQueue;
  }, [shuffledQueue]);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    userQueueRef.current = userQueue;
  }, [userQueue]);

  useEffect(() => {
    if (!globalAudio) {
      globalAudio = new Audio();
      globalAudio.preload = 'auto';
    }
    audioRef.current = globalAudio;
    globalAudio.volume = volumeRef.current;

    const audio = globalAudio;

    const handleTimeUpdate = () => setProgress(audio.currentTime);
    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      if (savedProgress.current > 0 && !isRestored.current) {
        audio.currentTime = savedProgress.current;
        isRestored.current = true;
      }
    };
    const handleCanPlayOnce = () => {
      audio.removeEventListener('canplay', handleCanPlayOnce);
      if (storedState?.isPlaying) {
        audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      }
    };
    const handleEnded = () => {
      if (loopRef.current) return;

      if (userQueueRef.current.length > 0) {
        const [nextTrack, ...rest] = userQueueRef.current;
        userQueueRef.current = rest;
        setUserQueue(rest);
        autoAdvancingRef.current = true;
        audio.src = `/api/music/stream/${nextTrack._id}`;
        audio.loop = loopRef.current;
        audio.load();
        audio.play().catch(() => {});
        savedProgress.current = 0;
        setProgress(0);
        setCurrentTrack(nextTrack);
        return;
      }

      const queue = queueRef.current;
      const idx = currentIndexRef.current;

      if (queue.length > 0 && idx >= 0) {
        const nextIndex = (idx + 1) % queue.length;
        const nextTrack = queue[nextIndex];
        currentIndexRef.current = nextIndex;
        autoAdvancingRef.current = true;
        audio.src = `/api/music/stream/${nextTrack._id}`;
        audio.loop = loopRef.current;
        audio.load();
        audio.play().catch(() => {});
        setCurrentIndex(nextIndex);
        savedProgress.current = 0;
        setProgress(0);
        setCurrentTrack(nextTrack);
      }
    };
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('canplay', handleCanPlayOnce);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    if (currentTrack) {
      audio.src = `/api/music/stream/${currentTrack._id}`;
      audio.loop = loopRef.current;
      audio.load();
    }

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('canplay', handleCanPlayOnce);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, []);

  useEffect(() => {
    const save = () => {
      if (currentTrack && audioRef.current) {
        setCookie({
          track: currentTrack,
          isPlaying,
          loop,
          volume,
          progress: audioRef.current.currentTime,
          currentPlaylist: currentPlaylist ? { _id: currentPlaylist._id, name: currentPlaylist.name } : null,
          playlistQueue: playlistQueue.map(t => ({ _id: t._id, title: t.title, originalName: t.originalName })),
          currentIndex,
          shuffle,
          shuffledQueue: shuffledQueue.map(t => ({ _id: t._id, title: t.title, originalName: t.originalName })),
          userQueue: userQueue.map(t => ({ _id: t._id, title: t.title, originalName: t.originalName, artist: t.artist }))
        });
      } else {
        setCookie({ volume });
      }
    };
    save();
    const interval = setInterval(save, 100);
    return () => clearInterval(interval);
  }, [currentTrack, isPlaying, loop, currentPlaylist, playlistQueue, currentIndex, shuffle, shuffledQueue, volume, userQueue]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;
    
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      return;
    }
    if (autoAdvancingRef.current) {
      autoAdvancingRef.current = false;
      return;
    }
    const newSrc = `/api/music/stream/${currentTrack._id}`;
    if (audio.src !== newSrc) {
      audio.src = newSrc;
      audio.loop = loopRef.current;
      isRestored.current = false;
      if (isPlayingRef.current) {
        const onCanPlay = () => {
          audio.removeEventListener('canplay', onCanPlay);
          audio.play().catch(() => {});
        };
        audio.addEventListener('canplay', onCanPlay);
      }
      audio.load();
    }
  }, [currentTrack]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    isPlayingRef.current = isPlaying;
    
    if (isPlaying) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  const playTrack = useCallback((track, playlist = null, queue = []) => {
    setCurrentTrack(track);
    setCurrentPlaylist(playlist);
    setPlaylistQueue(queue);
    setCurrentIndex(queue.findIndex(t => t._id === track._id));
    setProgress(0);
    savedProgress.current = 0;
    
    if (shuffleRef.current && queue.length > 0) {
      const shuffled = [...queue].sort(() => Math.random() - 0.5);
      const currentInShuffle = shuffled.findIndex(t => t._id === track._id);
      if (currentInShuffle > -1) {
        shuffled.splice(currentInShuffle, 1);
        shuffled.unshift(track);
      }
      setShuffledQueue(shuffled);
      setCurrentIndex(0);
    }
    
    setIsPlaying(true);
  }, []);

  const playPlaylist = useCallback((playlist) => {
    if (!playlist?.musicIds || playlist.musicIds.length === 0) return;
    
    const queue = playlist.musicIds;
    const firstTrack = queue[0];
    
    setCurrentPlaylist(playlist);
    setPlaylistQueue(queue);
    setCurrentIndex(0);
    setCurrentTrack(firstTrack);
    setProgress(0);
    savedProgress.current = 0;
    
    if (shuffleRef.current) {
      const shuffled = [...queue].sort(() => Math.random() - 0.5);
      shuffled.unshift(shuffled.pop());
      setShuffledQueue(shuffled);
      setCurrentIndex(0);
    }
    
    setIsPlaying(true);
  }, []);

  const playNext = useCallback(() => {
    if (userQueueRef.current.length > 0) {
      const [nextTrack, ...rest] = userQueueRef.current;
      userQueueRef.current = rest;
      setUserQueue(rest);
      setCurrentTrack(nextTrack);
      return;
    }
    const queue = shuffleRef.current ? shuffledQueueRef.current : playlistQueueRef.current;
    if (queue.length === 0) return;

    const nextIndex = (currentIndexRef.current + 1) % queue.length;
    currentIndexRef.current = nextIndex;
    setCurrentIndex(nextIndex);
    setCurrentTrack(queue[nextIndex]);
  }, []);

  const playPrevious = useCallback(() => {
    const queue = shuffleRef.current ? shuffledQueueRef.current : playlistQueueRef.current;
    if (queue.length === 0) return;

    const prevIndex = currentIndexRef.current <= 0 ? queue.length - 1 : currentIndexRef.current - 1;
    currentIndexRef.current = prevIndex;
    setCurrentIndex(prevIndex);
    setCurrentTrack(queue[prevIndex]);
  }, []);

  const togglePlay = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);

  const stop = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const dismissPlayer = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    setCookie({ volume: volumeRef.current });
    setIsPlaying(false);
    setCurrentTrack(null);
    setCurrentPlaylist(null);
    setPlaylistQueue([]);
    setCurrentIndex(-1);
    setUserQueue([]);
    userQueueRef.current = [];
    setProgress(0);
    setDuration(0);
    savedProgress.current = 0;
  }, []);

  const seek = useCallback((time) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setProgress(time);
    }
  }, []);

  const refreshPlaylists = useCallback(() => {
    if (playlistRef.current?.refresh) {
      playlistRef.current.refresh();
    }
  }, []);

  const toggleLoop = useCallback(() => {
    setLoop(prev => {
      const newLoop = !prev;
      loopRef.current = newLoop;
      if (audioRef.current) {
        audioRef.current.loop = newLoop;
      }
      return newLoop;
    });
  }, []);

  const changeVolume = useCallback((val) => {
    const v = Math.max(0, Math.min(1, val));
    volumeRef.current = v;
    if (audioRef.current) audioRef.current.volume = v;
    setVolume(v);
  }, []);

  const toggleShuffle = useCallback(() => {
    setShuffle(prev => {
      const newShuffle = !prev;
      shuffleRef.current = newShuffle;
      
      if (newShuffle && playlistQueue.length > 0) {
        const shuffled = [...playlistQueue].sort(() => Math.random() - 0.5);
        const currentIdx = shuffled.findIndex(t => t._id === currentTrack?._id);
        if (currentIdx > -1) {
          shuffled.splice(currentIdx, 1);
          shuffled.unshift(currentTrack);
        }
        setShuffledQueue(shuffled);
        setCurrentIndex(0);
      } else if (!newShuffle) {
        queueRef.current = playlistQueueRef.current;
      }
      
      return newShuffle;
    });
  }, [currentTrack, playlistQueue]);

  const addToQueue = useCallback((track) => {
    setUserQueue(prev => {
      const next = [...prev, track];
      userQueueRef.current = next;
      return next;
    });
  }, []);

  const removeFromQueue = useCallback((index) => {
    setUserQueue(prev => {
      const next = prev.filter((_, i) => i !== index);
      userQueueRef.current = next;
      return next;
    });
  }, []);

  const clearQueue = useCallback(() => {
    setUserQueue([]);
    userQueueRef.current = [];
  }, []);

  return (
    <MusicContext.Provider value={{
      currentTrack,
      isPlaying,
      loop,
      progress,
      duration,
      playTrack,
      playPlaylist,
      playNext,
      playPrevious,
      togglePlay,
      toggleLoop,
      toggleShuffle,
      stop,
      dismissPlayer,
      setIsPlaying,
      seek,
      playlistRef,
      refreshPlaylists,
      currentPlaylist,
      playlistQueue,
      shuffledQueue,
      currentIndex,
      shuffle,
      volume,
      changeVolume,
      userQueue,
      addToQueue,
      removeFromQueue,
      clearQueue
    }}>
      {children}
    </MusicContext.Provider>
  );
};

export const useMusic = () => useContext(MusicContext);
