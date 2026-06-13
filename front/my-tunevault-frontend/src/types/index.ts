export interface Song {
  id: string;
  title: string;
  artist: string;
  cover: string;
  url: string;
}

export interface Playlist {
  id: string;
  title: string;
  description: string;
  cover: string;
  trackCount?: number;
  tracks?: Song[];
  createdAt?: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  followerCount?: number;
  followingCount?: number;
  createdAt?: string;
}
