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
  isPublic?: boolean;
  createdAt?: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  bio?: string;
  avatarUrl?: string;
  followerCount?: number;
  followingCount?: number;
  createdAt?: string;
}

export interface PlayHistoryItem {
  id: string;
  mediaItemId: string;
  title: string;
  artist: string;
  streamUrl: string;
  coverPath: string | null;
  playedAt: string;
}

export interface UserSearchResult {
  id: string;
  username: string;
  avatarUrl?: string | null;
  bio?: string | null;
}

export interface FollowStatus {
  isFollowing: boolean;
  followerCount: number;
  followingCount: number;
}

export interface NotificationItem {
  id: string;
  type: number; // 1=Share, 2=Follow
  message: string;
  senderUsername?: string;
  targetId?: string | null;
  isRead: boolean;
  createdAt: string;
}
