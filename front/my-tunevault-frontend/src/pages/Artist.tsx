import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useMusic } from '../hooks/MusicContext';
import apiService from '../services/ApiService';
import ShareModal from '../components/ShareModal';
import styles from './Artist.module.css';
import type { User, Playlist, FollowStatus } from '../types';

const FALLBACK_AVATAR = (name: string) =>
  `data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="120" height="120"%3E%3Crect fill="%23535353" width="120" height="120" rx="60"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".35em" fill="%23fff" font-size="48" font-family="sans-serif"%3E${encodeURIComponent(name[0]?.toUpperCase() ?? '?')}%3C/text%3E%3C/svg%3E`;

const FALLBACK_COVER = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="160" height="160"%3E%3Crect fill="%23282828" width="160" height="160"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23535353" font-size="48"%3E%F0%9F%8E%B5%3C/text%3E%3C/svg%3E';

export default function UserPage() {
  const { id } = useParams<{ id: string }>();
  const { user: me } = useAuth();
  const { setQueue } = useMusic();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<User | null>(null);
  const [status, setStatus] = useState<FollowStatus>({ isFollowing: false, followerCount: 0, followingCount: 0 });
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [sharePlaylist, setSharePlaylist] = useState<Playlist | null>(null);

  const isOwnProfile = id === me?.id;

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    Promise.all([
      apiService.getUserById(id),
      apiService.getFollowStatus(id),
      apiService.getUserPublicPlaylists(id),
    ]).then(([u, s, pls]) => {
      setProfile(u);
      setStatus(s);
      setPlaylists(pls);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  const handleFollow = async () => {
    if (!id) return;
    setFollowLoading(true);
    try {
      if (status.isFollowing) {
        await apiService.unfollowUser(id);
        setStatus(prev => ({ ...prev, isFollowing: false, followerCount: Math.max(0, prev.followerCount - 1) }));
      } else {
        await apiService.followUser(id);
        setStatus(prev => ({ ...prev, isFollowing: true, followerCount: prev.followerCount + 1 }));
      }
    } catch { /* silent */ }
    finally { setFollowLoading(false); }
  };

  const handlePlayPlaylist = async (playlist: Playlist) => {
    try {
      const detail = await apiService.getPlaylist(playlist.id);
      if (detail.tracks && detail.tracks.length > 0) {
        setQueue(detail.tracks, 0);
      }
    } catch { /* silent */ }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <p style={{ color: '#b3b3b3' }}>Loading...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '12px' }}>
        <p style={{ color: '#b3b3b3', fontSize: '1rem' }}>User not found.</p>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: '1px solid #535353', color: '#fff', borderRadius: '20px', padding: '8px 20px', cursor: 'pointer', fontSize: '0.875rem' }}>Go back</button>
      </div>
    );
  }

  const joinYear = profile.createdAt ? new Date(profile.createdAt).getFullYear() : null;

  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <div className={styles.avatarWrap}>
          <img src={profile.avatarUrl ?? FALLBACK_AVATAR(profile.username)} alt={profile.username} onError={(e) => { e.currentTarget.src = FALLBACK_AVATAR(profile.username); }} className={styles.avatar} />
        </div>
        <div className={styles.info}>
          <p className={styles.meta}>Profile</p>
          <h1 className={styles.username}>{profile.username}</h1>
          {profile.bio && (<p className={styles.bio}>{profile.bio}</p>)}

          <div className={styles.stats}>
            <div className={styles.stat}><p className={styles.statValue}>{status.followerCount.toLocaleString()}</p><p className={styles.statLabel}>Followers</p></div>
            <div className={styles.stat}><p className={styles.statValue}>{status.followingCount.toLocaleString()}</p><p className={styles.statLabel}>Following</p></div>
            <div className={styles.stat}><p className={styles.statValue}>{playlists.length}</p><p className={styles.statLabel}>Public playlists</p></div>
            {joinYear && (<div className={styles.stat}><p className={styles.statValue}>{joinYear}</p><p className={styles.statLabel}>Member since</p></div>)}
          </div>

          {!isOwnProfile && (<button onClick={handleFollow} disabled={followLoading} className={styles.followBtn} style={{ border: status.isFollowing ? '1px solid #535353' : 'none', background: status.isFollowing ? 'transparent' : '#1db954', color: status.isFollowing ? '#fff' : '#000', opacity: followLoading ? 0.7 : 1 }} onMouseEnter={(e) => { if (!followLoading) (e.currentTarget as HTMLElement).style.transform = 'scale(1.04)'; }} onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}>{followLoading ? '...' : status.isFollowing ? 'Đang follow' : 'Follow'}</button>)}

          {isOwnProfile && (<button onClick={() => navigate('/profile')} className={styles.editBtn}>Chỉnh sửa Profile</button>)}
        </div>
      </div>

      {playlists.length > 0 && (
        <section>
          <h2 className={styles.sectionTitle}>Public Playlists</h2>
          <div className={styles.grid}>{playlists.map(pl => (<PlaylistCard key={pl.id} playlist={pl} onPlay={() => handlePlayPlaylist(pl)} onShare={() => setSharePlaylist(pl)} onNavigate={() => navigate(`/playlist/${pl.id}`)} />))}</div>
        </section>
      )}

      {playlists.length === 0 && !loading && (<div className={styles.noPlaylists}><p style={{ margin: 0, color: '#b3b3b3', fontSize: '0.875rem' }}>Người dùng này chưa có playlist công khai nào.</p></div>)}

      {sharePlaylist && (<ShareModal playlistId={sharePlaylist.id} title={sharePlaylist.title} onClose={() => setSharePlaylist(null)} />)}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div>
      <p style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#fff' }}>{value.toLocaleString()}</p>
      <p style={{ margin: 0, fontSize: '0.72rem', color: '#b3b3b3' }}>{label}</p>
    </div>
  );
}

function PlaylistCard({ playlist, onPlay, onShare, onNavigate }: {
  playlist: Playlist;
  onPlay: () => void;
  onShare: () => void;
  onNavigate: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      style={{
        backgroundColor: '#1a1a1a',
        borderRadius: '8px',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'background 0.15s',
        position: 'relative',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onNavigate}
    >
      {/* Cover */}
      <div style={{ position: 'relative' }}>
        <img
          src={playlist.cover || FALLBACK_COVER}
          alt={playlist.title}
          onError={(e) => { e.currentTarget.src = FALLBACK_COVER; }}
          style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }}
        />
        {/* Hover overlay */}
        {hovered && (
          <div style={{
            position: 'absolute', inset: 0,
            backgroundColor: 'rgba(0,0,0,0.55)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
          }}>
            <button
              onClick={(e) => { e.stopPropagation(); onPlay(); }}
              title="Play"
              style={{
                width: '38px', height: '38px', borderRadius: '50%',
                background: '#1db954', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.9rem',
              }}
            >
              ▶
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onShare(); }}
              title="Share"
              style={{
                width: '38px', height: '38px', borderRadius: '50%',
                background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)',
                cursor: 'pointer', color: '#fff', fontSize: '0.85rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              ↗
            </button>
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '10px 12px 12px' }}>
        <p style={{
          margin: 0, fontSize: '0.875rem', fontWeight: 600, color: '#fff',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {playlist.title}
        </p>
        <p style={{ margin: '3px 0 0', fontSize: '0.75rem', color: '#b3b3b3' }}>
          {playlist.trackCount ?? 0} bài hát
        </p>
      </div>
    </div>
  );
}
