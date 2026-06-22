import type { Song, Playlist, User, PlayHistoryItem, NotificationItem, UserSearchResult, FollowStatus, MediaItem, ShareItem } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5067/api';
const API_ORIGIN = API_BASE_URL.replace(/\/api.*$/, '');
const AUTH_TOKEN_KEY = 'auth_token';

// --- Request/Response types (internal, not exported) ---

interface LoginResponse {
  token: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface RawMediaItem {
  id: string;
  title: string;
  artist: string;
  filePath: string;
  coverPath?: string;
  durationSeconds: number;
  mediaType: number;
  ownerUsername?: string;
}

interface RawPlaylist {
  id: string;
  name: string;
  description?: string;
  cover?: string;
  coverUrl?: string;
  trackCount?: number;
  isPublic?: boolean;
  tracks?: RawMediaItem[];
  createdAt?: string;
}

interface FavouriteDto {
  mediaItemId: string;
  title: string;
  artist: string;
  addedAt: string;
}

// --- Helpers ---

// Nếu backend trả về relative URL (/api/...) thì prepend origin
function absoluteUrl(path: string): string {
  if (!path) return '';
  return path.startsWith('/') ? `${API_ORIGIN}${path}` : path;
}

function toSong(item: RawMediaItem): Song {
  return {
    id: item.id,
    title: item.title,
    artist: item.artist,
    url: absoluteUrl(item.filePath),
    cover: absoluteUrl(item.coverPath ?? ''),
    mediaType: item.mediaType,
    ownerUsername: item.ownerUsername,
  };
}

function toPlaylist(p: RawPlaylist): Playlist {
  return {
    id: p.id,
    title: p.name,
    description: p.description ?? '',
    cover: p.coverUrl ?? p.cover ?? '',
    tracks: p.tracks?.map(toSong),
    trackCount: p.trackCount ?? p.tracks?.length ?? 0,
    isPublic: p.isPublic,
    createdAt: p.createdAt,
  };
}

// --- ApiService ---

class ApiService {
  private getToken(): string | null {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  }

  private setToken(token: string): void {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  }

  clearToken(): void {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  }

  private async fetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) ?? {}),
    };

    const token = this.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });

    if (response.status === 401) {
      this.clearToken();
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`${response.status}: ${text}`);
    }

    if (response.status === 204) {
      return null as T;
    }

    return response.json();
  }

  // Auth
  async login(email: string, password: string): Promise<string> {
    const res = await this.fetch<ApiResponse<LoginResponse>>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (!res.success || !res.data) throw new Error(res.error ?? 'Login failed');
    this.setToken(res.data.token);
    return res.data.token;
  }

  async register(username: string, email: string, password: string): Promise<string> {
    const res = await this.fetch<ApiResponse<LoginResponse>>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    });
    if (!res.success || !res.data) throw new Error(res.error ?? 'Register failed');
    this.setToken(res.data.token);
    return res.data.token;
  }

  logout(): void {
    this.clearToken();
  }

  // User
  async getCurrentUser(): Promise<User> {
    const res = await this.fetch<ApiResponse<User>>('/user/me');
    if (!res.success || !res.data) throw new Error(res.error ?? 'Failed to fetch user');
    return res.data;
  }

  async getUserById(id: string): Promise<User> {
    const res = await this.fetch<ApiResponse<User>>(`/user/${id}`);
    if (!res.success || !res.data) throw new Error(res.error ?? 'User not found');
    return res.data;
  }

  async updateProfile(username: string, email: string, bio?: string): Promise<void> {
    await this.fetch('/user/me', {
      method: 'PUT',
      body: JSON.stringify({ username, email, bio: bio ?? null }),
    });
  }

  async uploadMedia(
    file: File,
    title: string,
    artist: string,
    mediaType: 1 | 2,
    cover?: File,
    onProgress?: (percent: number) => void
  ): Promise<Song> {
    const token = localStorage.getItem('auth_token');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    formData.append('artist', artist);
    formData.append('mediaType', String(mediaType));
    if (cover) formData.append('cover', cover);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${API_BASE_URL}/mediaitems/upload`);
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };

      xhr.onload = () => {
        try {
          const res = JSON.parse(xhr.responseText) as ApiResponse<RawMediaItem>;
          if (xhr.status >= 200 && xhr.status < 300 && res.success && res.data) {
            resolve(toSong(res.data));
          } else {
            reject(new Error(res.error ?? `Upload failed (${xhr.status})`));
          }
        } catch {
          reject(new Error(`Upload failed (${xhr.status})`));
        }
      };
      xhr.onerror = () => reject(new Error('Network error during upload'));
      xhr.send(formData);
    });
  }

  async uploadAvatar(file: File): Promise<string> {
    const token = localStorage.getItem('auth_token');
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${API_BASE_URL}/user/me/avatar`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`${response.status}: ${text}`);
    }
    const res = await response.json() as ApiResponse<{ avatarUrl: string }>;
    if (!res.success || !res.data) throw new Error('Avatar upload failed');
    return res.data.avatarUrl;
  }

  // Media
  async getSongs(): Promise<Song[]> {
    const res = await this.fetch<ApiResponse<RawMediaItem[]>>('/mediaitems');
    if (!res.success || !res.data) throw new Error(res.error ?? 'Failed to fetch songs');
    return res.data.map(toSong);
  }

  async getMediaById(id: string): Promise<Song> {
    const res = await this.fetch<ApiResponse<RawMediaItem>>(`/mediaitems/${id}`);
    if (!res.success || !res.data) throw new Error(res.error ?? 'Media not found');
    return toSong(res.data);
  }

  async searchSongs(query: string): Promise<Song[]> {
    const res = await this.fetch<ApiResponse<RawMediaItem[]>>(
      `/mediaitems/search?q=${encodeURIComponent(query)}`
    );
    if (!res.success) return [];
    return (res.data ?? []).map(toSong);
  }

  // Playlists
  async getPlaylists(): Promise<Playlist[]> {
    const res = await this.fetch<ApiResponse<RawPlaylist[]>>('/playlist');
    if (!res.success) return [];
    const playlists = (res.data ?? []).map(toPlaylist);

    // Nếu playlist nào chưa có cover, lấy từ detail (lấy cover track đầu tiên)
    const needsCover = playlists.filter(p => !p.cover && (p.trackCount ?? 0) > 0);
    if (needsCover.length > 0) {
      const allSongs = await this.getSongs().catch(() => [] as Song[]);
      const songMap = new Map(allSongs.map(s => [s.id, s]));
      await Promise.all(needsCover.map(async (p) => {
        try {
          const detail = await this.fetch<ApiResponse<RawPlaylist>>(`/playlist/${p.id}`);
          if (detail.success && detail.data?.tracks?.length) {
            const firstTrack = detail.data.tracks[0];
            const cover = absoluteUrl(firstTrack.coverPath ?? '') || songMap.get(firstTrack.id)?.cover || '';
            p.cover = cover;
          }
        } catch { /* silent */ }
      }));
    }
    return playlists;
  }

  async getPlaylist(id: string): Promise<Playlist> {
    const res = await this.fetch<ApiResponse<RawPlaylist>>(`/playlist/${id}`);
    if (!res.success || !res.data) throw new Error(res.error ?? 'Playlist not found');
    const playlist = toPlaylist(res.data);

    // Enrich tracks với cover + url đúng từ /mediaitems nếu backend chưa trả
    if (playlist.tracks && playlist.tracks.some(t => !t.cover || !t.url)) {
      const allSongs = await this.getSongs().catch(() => [] as Song[]);
      const songMap = new Map(allSongs.map(s => [s.id, s]));
      playlist.tracks = playlist.tracks.map(t => ({
        ...t,
        cover: t.cover || songMap.get(t.id)?.cover || '',
        url: t.url || songMap.get(t.id)?.url || '',
      }));
      if (!playlist.cover && playlist.tracks[0]?.cover) {
        playlist.cover = playlist.tracks[0].cover;
      }
    }
    return playlist;
  }

  async addTrackToPlaylist(playlistId: string, mediaItemId: string): Promise<void> {
    await this.fetch(`/playlist/${playlistId}/tracks`, {
      method: 'POST',
      body: JSON.stringify({ mediaItemId }),
    });
  }

  async removeTrackFromPlaylist(playlistId: string, mediaItemId: string): Promise<void> {
    await this.fetch(`/playlist/${playlistId}/tracks/${mediaItemId}`, {
      method: 'DELETE',
    });
  }

  async getPlayHistory(): Promise<PlayHistoryItem[]> {
    const res = await this.fetch<ApiResponse<PlayHistoryItem[]>>('/playhistory');
    if (!res.success) return [];
    return res.data ?? [];
  }

  async recordPlay(mediaItemId: string): Promise<void> {
    await this.fetch('/playhistory', {
      method: 'POST',
      body: JSON.stringify({ mediaItemId, durationSeconds: 0 }),
    });
  }

  // Notifications
  async getNotifications(unreadOnly = false): Promise<NotificationItem[]> {
    const res = await this.fetch<ApiResponse<NotificationItem[]>>(
      `/notification${unreadOnly ? '?unreadOnly=true' : ''}`
    );
    if (!res.success) return [];
    return res.data ?? [];
  }

  async getUnreadNotificationCount(): Promise<number> {
    const res = await this.fetch<ApiResponse<{ count: number }>>('/notification/unread-count');
    if (!res.success || !res.data) return 0;
    return res.data.count;
  }

  async markNotificationRead(id: string): Promise<void> {
    await this.fetch(`/notification/${id}/read`, { method: 'PUT' });
  }

  async markAllNotificationsRead(): Promise<void> {
    await this.fetch('/notification/read-all', { method: 'PUT' });
  }

  async deleteNotification(id: string): Promise<void> {
    await this.fetch(`/notification/${id}`, { method: 'DELETE' });
  }

  async togglePlaylistVisibility(playlistId: string, isPublic: boolean): Promise<void> {
    await this.fetch(`/playlist/${playlistId}/visibility`, {
      method: 'PATCH',
      body: JSON.stringify({ isPublic }),
    });
  }

  async createPlaylist(name: string): Promise<Playlist> {
    const res = await this.fetch<ApiResponse<RawPlaylist>>('/playlist', {
      method: 'POST',
      body: JSON.stringify({ name, isPublic: false }),
    });
    if (!res.success || !res.data) throw new Error(res.error ?? 'Failed to create playlist');
    return toPlaylist(res.data);
  }

  // Favourites
  async getFavourites(): Promise<string[]> {
    const res = await this.fetch<ApiResponse<FavouriteDto[]>>('/favourite');
    if (!res.success || !res.data) return [];
    return res.data.map((f) => f.mediaItemId);
  }

  async toggleFavourite(mediaItemId: string): Promise<boolean> {
    const res = await this.fetch<ApiResponse<{ isFavourite: boolean }>>('/favourite/toggle', {
      method: 'POST',
      body: JSON.stringify({ mediaItemId }),
    });
    if (!res.success || !res.data) throw new Error(res.error ?? 'Toggle favourite failed');
    return res.data.isFavourite;
  }

  // Search users
  async searchUsers(q: string): Promise<UserSearchResult[]> {
    const res = await this.fetch<ApiResponse<UserSearchResult[]>>(
      `/user/search?q=${encodeURIComponent(q)}`
    );
    if (!res.success) return [];
    return res.data ?? [];
  }

  // Share
  async shareMedia(receiverUserId: string, mediaItemId?: string, playlistId?: string): Promise<void> {
    await this.fetch('/share', {
      method: 'POST',
      body: JSON.stringify({ receiverUserId, mediaItemId: mediaItemId ?? null, playlistId: playlistId ?? null }),
    });
  }

  async getShareInbox(): Promise<ShareItem[]> {
    const res = await this.fetch<ApiResponse<ShareItem[]>>('/share/inbox');
    if (!res.success) return [];
    return res.data ?? [];
  }

  async getShareSent(): Promise<ShareItem[]> {
    const res = await this.fetch<ApiResponse<ShareItem[]>>('/share/sent');
    if (!res.success) return [];
    return res.data ?? [];
  }

  async deleteShare(id: string): Promise<void> {
    await this.fetch(`/share/${id}`, { method: 'DELETE' });
  }

  // Follow
  async followUser(userId: string): Promise<void> {
    await this.fetch('/follow', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }

  async unfollowUser(userId: string): Promise<void> {
    await this.fetch(`/follow/${userId}`, { method: 'DELETE' });
  }

  async getFollowStatus(userId: string): Promise<FollowStatus> {
    const res = await this.fetch<ApiResponse<FollowStatus>>(`/follow/${userId}/status`);
    if (!res.success || !res.data) return { isFollowing: false, followerCount: 0, followingCount: 0 };
    return res.data;
  }

  // Public playlists of a user
  async getUserPublicPlaylists(userId: string): Promise<Playlist[]> {
    const res = await this.fetch<ApiResponse<RawPlaylist[]>>(`/playlist/user/${userId}/public`);
    if (!res.success) return [];
    return (res.data ?? []).map(toPlaylist);
  }

  // Media items uploaded by the current user
  async getMyUploads(): Promise<MediaItem[]> {
    const res = await this.fetch<ApiResponse<MediaItem[]>>('/mediaitems/my-uploads');
    if (!res.success) return [];
    return res.data ?? [];
  }

  // Delete a media item (only owner can do this)
  async deleteMedia(id: string): Promise<void> {
    await this.fetch<ApiResponse<null>>(`/mediaitems/${id}`, { method: 'DELETE' });
  }
}

export default new ApiService();
