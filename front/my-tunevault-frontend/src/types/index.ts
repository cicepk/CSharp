// User Types
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  premium: boolean;
}

// Music Types
export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  cover: string;
  url: string;
}

export interface Album {
  id: string;
  title: string;
  artist: string;
  cover: string;
  tracks: Track[];
  releaseDate: string;
}

export interface Playlist {
  id: string;
  title: string;
  description: string;
  cover: string;
  tracks: Track[];
  createdAt: string;
}

export interface Artist {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  followers: number;
  tracks: Track[];
}

// Player Types
export interface PlayerState {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  volume: number;
  queue: Track[];
  queueIndex: number;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
