import React, { createContext, useContext, useRef, useState, useCallback, useEffect } from 'react';
import type { Song } from '../types';
import apiService from '../services/ApiService';
import { useAuth } from '../contexts/AuthContext';

interface MusicContextType {
  currentSong: Song | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  queue: Song[];
  queueIndex: number;
  playSong: (song: Song) => void;
  pauseSong: () => void;
  togglePlayPause: () => void;
  setQueue: (songs: Song[], startIndex: number) => void;
  playNext: () => void;
  playPrevious: () => void;
  volume: number;
  setVolume: (v: number) => void;
  isFavorite: (id: string) => boolean;
  toggleFavorite: (song: Song) => void;
  collections: Array<{ id: string; name: string; songIds: string[] }>;
  createCollection: (name: string, songIds?: string[]) => void;
  addSongToCollection: (collectionId: string, songId: string) => void;
  removeSongFromCollection: (collectionId: string, songId: string) => void;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

export function MusicProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [queue, setQueueState] = useState<Song[]>([]);
  const [queueIndex, setQueueIndex] = useState(-1);
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
    if (!song || !audioRef.current) return;
    audioRef.current.src = song.url;
    audioRef.current.play();
    setCurrentSong(song);
    setIsPlaying(true);
    setQueueIndex(index);
  }, []);

  const playSong = useCallback((song: Song) => {
    if (!audioRef.current) return;
    if (currentSong?.id === song.id && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.src = song.url;
      audioRef.current.play();
      setCurrentSong(song);
      setIsPlaying(true);
    }
  }, [currentSong?.id, isPlaying]);

  const setQueue = useCallback((songs: Song[], startIndex: number) => {
    setQueueState(songs);
    playSongAtIndex(songs, startIndex);
  }, [playSongAtIndex]);

  const playNext = useCallback(() => {
    if (queue.length === 0) return;
    const nextIndex = (queueIndex + 1) % queue.length;
    playSongAtIndex(queue, nextIndex);
  }, [queue, queueIndex, playSongAtIndex]);

  const playPrevious = useCallback(() => {
    if (queue.length === 0) return;
    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      return;
    }
    const prevIndex = (queueIndex - 1 + queue.length) % queue.length;
    playSongAtIndex(queue, prevIndex);
  }, [queue, queueIndex, playSongAtIndex]);

  const pauseSong = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const togglePlayPause = useCallback(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else if (currentSong) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, [isPlaying, currentSong]);

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
      queue,
      queueIndex,
      playSong,
      pauseSong,
      togglePlayPause,
      setQueue,
      playNext,
      playPrevious,
      volume,
      setVolume,
      isFavorite,
      toggleFavorite,
      collections,
      createCollection,
      addSongToCollection,
      removeSongFromCollection,
    }}>
      <audio
        ref={audioRef}
        onEnded={playNext}
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
