import React, { createContext, useContext, useRef, useState, useCallback } from 'react';

export interface Song {
  id: number;
  title: string;
  artist: string;
  cover: string;
  audio: string;
}

interface MusicContextType {
  currentSong: Song | null;
  isPlaying: boolean;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  playSong: (song: Song) => void;
  pauseSong: () => void;
  togglePlayPause: () => void;
  setSongData: (song: Song | null) => void;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

export function MusicProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const playSong = useCallback((song: Song) => {
    if (audioRef.current) {
      if (currentSong?.id === song.id && isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.src = song.audio;
        audioRef.current.play();
        setCurrentSong(song);
        setIsPlaying(true);
      }
    }
  }, [currentSong?.id, isPlaying]);

  const pauseSong = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const togglePlayPause = useCallback(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else if (currentSong) {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  }, [isPlaying, currentSong]);

  const setSongData = useCallback((song: Song | null) => {
    setCurrentSong(song);
  }, []);

  const handleAudioEnd = () => {
    setIsPlaying(false);
  };

  return (
    <MusicContext.Provider value={{
      currentSong,
      isPlaying,
      audioRef,
      playSong,
      pauseSong,
      togglePlayPause,
      setSongData
    }}>
      <audio
        ref={audioRef}
        onEnded={handleAudioEnd}
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
