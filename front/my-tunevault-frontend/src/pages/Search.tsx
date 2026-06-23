import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMusic } from '../hooks/MusicContext';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/ApiService';
import ShareModal from '../components/ShareModal';
import styles from './Search.module.css';
import type { Song, UserSearchResult } from '../types';
import playButtonImg from '../assets/icons/play-button.png';

const FALLBACK_COVER = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="180" height="180"%3E%3Crect fill="%23282828" width="180" height="180"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23b3b3b3" font-size="40"%3E%F0%9F%8E%B5%3C/text%3E%3C/svg%3E';

const FALLBACK_AVATAR = (name: string) =>
  `data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="48" height="48"%3E%3Crect fill="%23535353" width="48" height="48" rx="50%25"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".35em" fill="%23fff" font-size="20" font-family="sans-serif"%3E${encodeURIComponent(name[0]?.toUpperCase() ?? '?')}%3C/text%3E%3C/svg%3E`;

// Theo dõi follow state cục bộ trong search results (không cần global store)
function UserCard({ user }: { user: UserSearchResult }) {
  const navigate = useNavigate();
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleFollow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setLoading(true);
    try {
      if (following) {
        await apiService.unfollowUser(user.id);
        setFollowing(false);
      } else {
        await apiService.followUser(user.id);
        setFollowing(true);
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  return (
    <div
      onClick={() => navigate(`/artist/${user.id}`)}
      style={{
        display: 'flex', alignItems: 'center', gap: '14px',
        padding: '12px 16px',
        backgroundColor: '#1a1a1a',
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'background 0.15s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = '#282828'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = '#1a1a1a'; }}
    >
      <img
        src={user.avatarUrl ?? FALLBACK_AVATAR(user.username)}
        alt={user.username}
        onError={(e) => { e.currentTarget.src = FALLBACK_AVATAR(user.username); }}
        style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
      />

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {user.username}
        </p>
        {user.bio && (
          <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#b3b3b3', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user.bio}
          </p>
        )}
      </div>

      <button
        onClick={handleFollow}
        disabled={loading}
        style={{
          padding: '7px 18px',
          borderRadius: '20px',
          border: following ? '1px solid #535353' : 'none',
          background: following ? 'transparent' : '#1db954',
          color: following ? '#fff' : '#000',
          fontSize: '0.8rem',
          fontWeight: 700,
          cursor: loading ? 'not-allowed' : 'pointer',
          flexShrink: 0,
          opacity: loading ? 0.6 : 1,
          transition: 'background 0.15s',
          whiteSpace: 'nowrap',
        }}
      >
        {loading ? '...' : following ? 'Đang follow' : 'Follow'}
      </button>
    </div>
  );
}

export default function Search() {
  const [query, setQuery] = useState('');
  const [songs, setSongs] = useState<Song[]>([]);
  const [users, setUsers] = useState<UserSearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [shareTarget, setShareTarget] = useState<Song | null>(null);
  const [recommendations, setRecommendations] = useState<Song[]>([]);
  const { currentSong, isPlaying, setQueue } = useMusic();
  const { user } = useAuth();
  const navigate = useNavigate();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!user) return;
    apiService.getRecommendations().then(setRecommendations).catch(() => {});
  }, [user]);

  const doSearch = async (q: string) => {
    if (!q.trim()) return;
    setIsLoading(true);
    setHasSearched(true);
    try {
      const [songResults, userResults] = await Promise.all([
        apiService.searchSongs(q),
        q.length >= 2 ? apiService.searchUsers(q) : Promise.resolve([]),
      ]);
      setSongs(songResults);
      setUsers(userResults);
    } catch {
      setSongs([]);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    doSearch(query);
  };

  const handleInput = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length >= 2) {
      debounceRef.current = setTimeout(() => doSearch(value), 400);
    } else if (!value.trim()) {
      setSongs([]);
      setUsers([]);
      setHasSearched(false);
    }
  };

  const hasResults = songs.length > 0 || users.length > 0;

  return (
    <>
      <div className={styles.container}>
        {/* Search bar */}
        <form onSubmit={handleSearch} className={styles.searchForm}>
          <input
            className={styles.searchInput}
            type="text"
            value={query}
            onChange={(e) => handleInput(e.target.value)}
            placeholder="Tìm bài hát, nghệ sĩ, người dùng..."
            onFocus={(e) => { e.currentTarget.style.boxShadow = '0 0 0 2px #1db954'; }}
            onBlur={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
          />
          <button type="submit" className={styles.searchBtn} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1ed760'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#1db954'; }}>Search</button>
        </form>

        {isLoading && <p className={styles.message}>Đang tìm kiếm...</p>}
        {hasSearched && !isLoading && !hasResults && (<p className={styles.message}>Không tìm thấy kết quả nào</p>)}

        {/* Recommendations — chỉ hiện khi chưa search */}
        {!hasSearched && recommendations.length > 0 && (
          <section>
            <h2 className={styles.sectionTitle}>Dựa trên sở thích nghe của bạn</h2>
            <div className={styles.grid}>
              {recommendations.map((song, idx) => {
                const isActive = currentSong?.id === song.id;
                return (
                  <SongCard
                    key={song.id}
                    song={song}
                    isActive={isActive}
                    isPlaying={isPlaying}
                    onPlay={() => {
                      setQueue(recommendations, idx);
                      if (song.mediaType === 2) navigate(`/video/${song.id}`);
                    }}
                    onShare={() => setShareTarget(song)}
                  />
                );
              })}
            </div>
          </section>
        )}

        {!hasSearched && recommendations.length === 0 && (
          <p className={styles.message}>Tìm kiếm bài hát hoặc người dùng</p>
        )}

        {/* Users section */}
        {users.length > 0 && (
          <section>
            <h2 className={styles.sectionTitle}>Người dùng</h2>
            <div className={styles.userList}>{users.map(u => <UserCard key={u.id} user={u} />)}</div>
          </section>
        )}

        {/* Songs section */}
        {songs.length > 0 && (
          <section>
            <h2 className={styles.sectionTitle}>Bài hát</h2>
            <div className={styles.grid}>
              {songs.map((song, idx) => {
                const isActive = currentSong?.id === song.id;
                return (
                  <SongCard
                    key={song.id}
                    song={song}
                    isActive={isActive}
                    isPlaying={isPlaying}
                    onPlay={() => {
                      setQueue(songs, idx);
                      if (song.mediaType === 2) navigate(`/video/${song.id}`);
                    }}
                    onShare={() => setShareTarget(song)}
                  />
                );
              })}
            </div>
          </section>
        )}
      </div>

      {shareTarget && (
        <ShareModal
          mediaItemId={shareTarget.id}
          title={`${shareTarget.title} — ${shareTarget.artist}`}
          onClose={() => setShareTarget(null)}
        />
      )}
    </>
  );
}

function SongCard({ song, isActive, isPlaying: _isPlaying, onPlay, onShare }: {
  song: Song;
  isActive: boolean;
  isPlaying: boolean;
  onPlay: () => void;
  onShare: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onPlay}
      className={styles.cardWrapper}
      style={{
        transform: isActive ? 'scale(1.05)' : hovered ? 'scale(1.04)' : 'scale(1)',
        boxShadow: isActive ? '0 0 16px rgba(29,185,84,0.5)' : 'none',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <img
        src={song.cover || FALLBACK_COVER}
        alt={song.title}
        className={styles.cardImg}
        onError={(e) => { e.currentTarget.src = FALLBACK_COVER; }}
      />

      {/* Overlay */}
      <div style={{
        position: 'absolute', inset: '0 0 52px 0',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        backgroundColor: 'rgba(0,0,0,0.55)',
        opacity: isActive || hovered ? 1 : 0,
        transition: 'opacity 0.2s',
      }}>
        <div style={{
          width: '36px', height: '36px', borderRadius: '50%',
          backgroundColor: 'rgba(29,185,84,0.9)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <img src={playButtonImg} alt="Play" style={{ width: '16px', height: '16px' }} />
        </div>
        {/* Share */}
        <button
          onClick={(e) => { e.stopPropagation(); onShare(); }}
          title="Chia sẻ"
          style={{
            width: '32px', height: '32px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.15)',
            border: '1px solid rgba(255,255,255,0.4)',
            color: '#fff', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.8rem',
          }}
        >
          ↗
        </button>
      </div>

      <div className={styles.cardInfo}>
        <p className={styles.cardTitle}>{song.title}</p>
        <p className={styles.cardSub}>{song.artist}</p>
      </div>
    </div>
  );
}
