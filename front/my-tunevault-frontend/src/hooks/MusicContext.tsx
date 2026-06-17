import React, { createContext, useContext, useRef, useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Song } from '../types';
import apiService from '../services/ApiService';
import { useAuth } from '../contexts/AuthContext';

interface MusicContextType {
  currentSong: Song | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  queue: Song[];
  queueIndex: number;
  isRepeat: boolean;
  isShuffle: boolean;
  playSong: (song: Song) => void;
  pauseSong: () => void;
  togglePlayPause: () => void;
  setQueue: (songs: Song[], startIndex: number) => void;
  loadVideo: (song: Song) => void;
  onVideoPlay: () => void;
  onVideoPause: () => void;
  onVideoTimeUpdate: () => void;
  onVideoLoadedMetadata: () => void;
  onVideoEnded: () => void;
  playNext: () => void;
  playPrevious: () => void;
  toggleRepeat: () => void;
  toggleShuffle: () => void;
  volume: number;
  setVolume: (v: number) => void;
  isFavorite: (id: string) => boolean;
  toggleFavorite: (song: Song) => void;
  collections: Array<{ id: string; name: string; songIds: string[] }>;
  createCollection: (name: string, songIds?: string[]) => void;
  addSongToCollection: (collectionId: string, songId: string) => void;
  removeSongFromCollection: (collectionId: string, songId: string) => void;
  // Global songs list (shared between Home and Profile)
  songs: Song[];
  songsLoading: boolean;
  removeSongById: (id: string) => void;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

export function MusicProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastRecordedIdRef = useRef<string | null>(null);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [queue, setQueueState] = useState<Song[]>([]);
  const [queueIndex, setQueueIndex] = useState(-1);
  const [isRepeat, setIsRepeat] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [volume, setVolume] = useState<number>(70);

  // Favorites stored as set of song ids (persist to localStorage)
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem('favorites');
      const arr: string[] = raw ? JSON.parse(raw) : [];
      return new Set(arr);
    } catch {
      return new Set();
    }
  });

  const { isAuthenticated } = useAuth();

  // Global songs list
  const [songs, setSongs] = useState<Song[]>([]);
  const [songsLoading, setSongsLoading] = useState(true);

  useEffect(() => {
    apiService.getSongs()
      .then(setSongs)
      .catch(() => {})
      .finally(() => setSongsLoading(false));
  }, []);

  const removeSongById = useCallback((id: string) => {
    setSongs(prev => prev.filter(s => s.id !== id));
  }, []);

  // Collections state (persisted to localStorage)
  const [collections, setCollections] = useState<Array<{ id: string; name: string; songIds: string[] }>>(() => {
    try {
      const raw = localStorage.getItem('fav_collections');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // When user logs in, load favourites from backend
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!isAuthenticated) return;
      try {
        const favs = await apiService.getFavourites();
        if (!mounted) return;
        setFavorites(new Set(favs));
        // Ensure default 'favorite' collection exists and contains these favs
        setCollections(prev => {
          const exists = prev.some(c => c.id === 'col-favorite');
            if (exists) return prev;
            return [{ id: 'col-favorite', name: 'My Favorites', songIds: favs }, ...prev];
        });
      } catch {
        // fallback to localStorage (keep existing)
      }
    };
    load();
    return () => { mounted = false; };
  }, [isAuthenticated]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume / 100;
    if (videoRef.current) videoRef.current.volume = volume / 100;
  }, [volume]);

  useEffect(() => {
    try {
      localStorage.setItem('favorites', JSON.stringify(Array.from(favorites)));
    } catch {
      // ignore
    }
  }, [favorites]);

  // persist collections
  useEffect(() => {
    try {
      localStorage.setItem('fav_collections', JSON.stringify(collections));
    } catch {
      // ignore
    }
  }, [collections]);

  const playSongAtIndex = useCallback((songs: Song[], index: number) => {
    const song = songs[index];
    if (!song) return;
    if (videoRef.current) videoRef.current.pause();
    setCurrentSong(song);
    setQueueIndex(index);
    if (song.mediaType === 2) {
      if (audioRef.current) audioRef.current.pause();
      setIsPlaying(false);
      navigate(`/video/${song.id}`);
    } else if (audioRef.current) {
      audioRef.current.src = song.url;
      audioRef.current.play();
      setIsPlaying(true);
    }
    if (song.id !== lastRecordedIdRef.current) {
      lastRecordedIdRef.current = song.id;
      apiService.recordPlay(song.id).catch(() => {});
    }
  }, [navigate]);

  const playSong = useCallback((song: Song) => {
    if (currentSong?.id === song.id && isPlaying) {
      if (audioRef.current) audioRef.current.pause();
      if (videoRef.current) videoRef.current.pause();
      setIsPlaying(false);
    } else {
      if (song.id !== lastRecordedIdRef.current) {
        lastRecordedIdRef.current = song.id;
        apiService.recordPlay(song.id).catch(() => {});
      }
      if (videoRef.current) videoRef.current.pause();
      setCurrentSong(song);
      if (song.mediaType === 2) {
        if (audioRef.current) audioRef.current.pause();
        setIsPlaying(false);
        navigate(`/video/${song.id}`);
      } else if (audioRef.current) {
        audioRef.current.src = song.url;
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  }, [currentSong?.id, isPlaying, navigate]);

  // Đăng ký bài hiện tại khi vào trang /video/:id trực tiếp (vd. bookmark) — không qua setQueue
  const loadVideo = useCallback((song: Song) => {
    if (audioRef.current) audioRef.current.pause();
    setCurrentSong(song);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    if (song.id !== lastRecordedIdRef.current) {
      lastRecordedIdRef.current = song.id;
      apiService.recordPlay(song.id).catch(() => {});
    }
  }, []);

  const onVideoPlay = useCallback(() => setIsPlaying(true), []);
  const onVideoPause = useCallback(() => setIsPlaying(false), []);
  const onVideoTimeUpdate = useCallback(() => setCurrentTime(videoRef.current?.currentTime ?? 0), []);
  const onVideoLoadedMetadata = useCallback(() => setDuration(videoRef.current?.duration ?? 0), []);

  const getActiveRef = useCallback((): HTMLAudioElement | HTMLVideoElement | null => {
    return currentSong?.mediaType === 2 ? videoRef.current : audioRef.current;
  }, [currentSong?.mediaType]);

  const setQueue = useCallback((songs: Song[], startIndex: number) => {
    setQueueState(songs);
    playSongAtIndex(songs, startIndex);
  }, [playSongAtIndex]);

  const toggleRepeat = useCallback(() => setIsRepeat(r => !r), []);
  const toggleShuffle = useCallback(() => setIsShuffle(s => !s), []);

  const playNext = useCallback(() => {
    if (queue.length === 0) return;
    let nextIndex: number;
    if (isShuffle) {
      // pick a random index different from current
      let rand = Math.floor(Math.random() * queue.length);
      if (queue.length > 1 && rand === queueIndex) rand = (rand + 1) % queue.length;
      nextIndex = rand;
    } else {
      nextIndex = (queueIndex + 1) % queue.length;
    }
    playSongAtIndex(queue, nextIndex);
  }, [queue, queueIndex, isShuffle, playSongAtIndex]);

  const onVideoEnded = useCallback(() => {
    if (isRepeat && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
    } else {
      playNext();
    }
  }, [isRepeat, playNext]);

  const playPrevious = useCallback(() => {
    if (queue.length === 0) return;
    const activeRef = getActiveRef();
    if (activeRef && activeRef.currentTime > 3) {
      activeRef.currentTime = 0;
      return;
    }
    const prevIndex = (queueIndex - 1 + queue.length) % queue.length;
    playSongAtIndex(queue, prevIndex);
  }, [queue, queueIndex, playSongAtIndex, getActiveRef]);

  const pauseSong = useCallback(() => {
    const activeRef = getActiveRef();
    if (activeRef) {
      activeRef.pause();
      setIsPlaying(false);
    }
  }, [getActiveRef]);

  const togglePlayPause = useCallback(() => {
    const activeRef = getActiveRef();
    if (!activeRef) return;
    if (isPlaying) {
      activeRef.pause();
      setIsPlaying(false);
    } else if (currentSong) {
      activeRef.play();
      setIsPlaying(true);
    }
  }, [isPlaying, currentSong, getActiveRef]);

  const isFavorite = useCallback((id: string) => {
    return favorites.has(id);
  }, [favorites]);

  const toggleFavorite = useCallback(async (song: Song) => {
    // If user authenticated, call backend toggle endpoint
    if (isAuthenticated) {
      try {
        const isFav = await apiService.toggleFavourite(song.id);
        setFavorites(prev => {
          const next = new Set(prev);
          if (isFav) next.add(song.id); else next.delete(song.id);
          return next;
        });

        // update default collection named 'favorite'
        setCollections(prev => {
          const next = prev.slice();
          let def = next.find(c => c.id === 'col-favorite');
          if (!def && isFav) {
            def = { id: 'col-favorite', name: 'My Favorites', songIds: [song.id] };
            next.unshift(def);
            return next;
          }
          if (!def) return next;
          if (isFav) {
            if (!def.songIds.includes(song.id)) def.songIds.push(song.id);
          } else {
            def.songIds = def.songIds.filter(id => id !== song.id);
          }
          return next;
        });
        return;
      } catch {
        // fallback to local behaviour
      }
    }

    // Fallback: local toggle
    setFavorites(prev => {
      const next = new Set(prev);
      const adding = !next.has(song.id);
      if (adding) next.add(song.id); else next.delete(song.id);

      // update default collection accordingly
      setCollections(prevCols => {
        const nextCols = prevCols.slice();
        let def = nextCols.find(c => c.id === 'col-favorite');
        if (!def && adding) {
          def = { id: 'col-favorite', name: 'My Favorites', songIds: [song.id] };
          nextCols.unshift(def);
          return nextCols;
        }
        if (!def) return nextCols;
        if (adding) {
          if (!def.songIds.includes(song.id)) def.songIds.push(song.id);
        } else {
          def.songIds = def.songIds.filter(id => id !== song.id);
        }
        return nextCols;
      });

      return next;
    });
  }, [isAuthenticated]);

  const createCollection = useCallback((name: string, songIds: string[] = []) => {
    const nameLower = name.trim().toLowerCase();
    // If user attempts to create a favorite-named collection, reuse the single favorite collection
    if (nameLower.includes('favorite')) {
      setCollections(prev => {
        const existing = prev.find(c => c.id === 'col-favorite');
        if (existing) {
          // merge songIds into existing
          const merged = Array.from(new Set([...existing.songIds, ...songIds]));
          return prev.map(c => c.id === existing.id ? { ...c, songIds: merged } : c);
        }
        // create canonical favorite collection
        return [{ id: 'col-favorite', name: 'My Favorites', songIds }, ...prev];
      });
      return;
    }

    const id = `col-${Date.now()}`;
    setCollections(prev => [...prev, { id, name, songIds }]);
  }, []);

  // Ensure there's only one favorite collection — merge duplicates if present
  useEffect(() => {
    if (collections.length <= 1) return;
    const favs = collections.filter(c => c.id === 'col-favorite' || c.name.toLowerCase().includes('favorite'));
    if (favs.length <= 1) return;
    // merge into single canonical favorite collection
    const mergedIds = Array.from(new Set(favs.flatMap(c => c.songIds)));
    const nonFav = collections.filter(c => !(c.id === 'col-favorite' || c.name.toLowerCase().includes('favorite')));
    const canonical = { id: 'col-favorite', name: 'My Favorites', songIds: mergedIds };
    setCollections([canonical, ...nonFav]);
  }, [collections]);

  const addSongToCollection = useCallback((collectionId: string, songId: string) => {
    setCollections(prev => prev.map(c => c.id === collectionId ? { ...c, songIds: Array.from(new Set([...c.songIds, songId])) } : c));
  }, []);

  const removeSongFromCollection = useCallback((collectionId: string, songId: string) => {
    setCollections(prev => prev.map(c => c.id === collectionId ? { ...c, songIds: c.songIds.filter(id => id !== songId) } : c));
  }, []);

  return (
    <MusicContext.Provider value={{
      currentSong,
      isPlaying,
      currentTime,
      duration,
      audioRef,
      videoRef,
      queue,
      queueIndex,
      isRepeat,
      isShuffle,
      playSong,
      pauseSong,
      togglePlayPause,
      setQueue,
      loadVideo,
      onVideoPlay,
      onVideoPause,
      onVideoTimeUpdate,
      onVideoLoadedMetadata,
      onVideoEnded,
      playNext,
      playPrevious,
      toggleRepeat,
      toggleShuffle,
      volume,
      setVolume,
      isFavorite,
      toggleFavorite,
      collections,
      createCollection,
      addSongToCollection,
      removeSongFromCollection,
      songs,
      songsLoading,
      removeSongById,
    }}>
      <audio
        ref={audioRef}
        onEnded={() => {
          if (isRepeat && audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play();
          } else {
            playNext();
          }
        }}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime ?? 0)}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration ?? 0)}
      />
      {children}
    </MusicContext.Provider>
  );
}

export function useMusic() {
  const context = useContext(MusicContext);
  if (context === undefined) {
    throw new Error('useMusic must be used within a MusicProvider');
  }
  return context;
}
