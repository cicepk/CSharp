import type { Song, Playlist, User } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5067/api';
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
}

interface RawPlaylist {
  id: string;
  name: string;
  description?: string;
  cover?: string;
  tracks?: RawMediaItem[];
  createdAt?: string;
}

// --- Helpers ---

function toSong(item: RawMediaItem): Song {
  return {
    id: item.id,
    title: item.title,
    artist: item.artist,
    url: item.filePath,
    cover: item.coverPath ?? '',
  };
}

function toPlaylist(p: RawPlaylist): Playlist {
  return {
    id: p.id,
    title: p.name,
    description: p.description ?? '',
    cover: p.cover ?? '',
    tracks: p.tracks?.map(toSong),
    trackCount: p.tracks?.length ?? 0,
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

  // Media
  async getSongs(): Promise<Song[]> {
    const res = await this.fetch<ApiResponse<RawMediaItem[]>>('/mediaitems');
    if (!res.success || !res.data) throw new Error(res.error ?? 'Failed to fetch songs');
    return res.data.map(toSong);
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
    return (res.data ?? []).map(toPlaylist);
  }

  async getPlaylist(id: string): Promise<Playlist> {
    const res = await this.fetch<ApiResponse<RawPlaylist>>(`/playlist/${id}`);
    if (!res.success || !res.data) throw new Error(res.error ?? 'Playlist not found');
    return toPlaylist(res.data);
  }
}

export default new ApiService();
