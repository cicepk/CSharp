import React, { createContext, useContext, useRef, useState, useCallback } from 'react';
import type { Song } from '../types';
import apiService from '../services/ApiService';

interface MusicContextType {
  currentSong: Song | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  queue: Song[];
  queueIndex: number;
  isRepeat: boolean;
  isShuffle: boolean;
  playSong: (song: Song) => void;
  pauseSong: () => void;
  togglePlayPause: () => void;
  setQueue: (songs: Song[], startIndex: number) => void;
  playNext: () => void;
  playPrevious: () => void;
  toggleRepeat: () => void;
  toggleShuffle: () => void;
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
  const [isRepeat, setIsRepeat] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);

  const playSongAtIndex = useCallback((songs: Song[], index: number) => {
    const song = songs[index];
    if (!song || !audioRef.current) return;
    audioRef.current.src = song.url;
    audioRef.current.play();
    setCurrentSong(song);
    setIsPlaying(true);
    setQueueIndex(index);
    apiService.recordPlay(song.id).catch(() => {});
  }, []);

  const playSong = useCallback((song: Song) => {
    if (!audioRef.current) return;
    if (currentSong?.id === song.id && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      if (currentSong?.id !== song.id) {
        apiService.recordPlay(song.id).catch(() => {});
      }
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
      isRepeat,
      isShuffle,
      playSong,
      pauseSong,
      togglePlayPause,
      setQueue,
      playNext,
      playPrevious,
      toggleRepeat,
      toggleShuffle,
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
