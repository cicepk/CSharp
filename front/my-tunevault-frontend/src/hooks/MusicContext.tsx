import React, { createContext, useContext, useRef, useState, useCallback } from 'react';
import type { Song } from '../types';

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
