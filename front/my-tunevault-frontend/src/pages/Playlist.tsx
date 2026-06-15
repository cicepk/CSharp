import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import apiService from '../services/ApiService';
import { useMusic } from '../hooks/MusicContext';
import type { Playlist, Song } from '../types';
import ShareModal from '../components/ShareModal';
import styles from './Playlist.module.css';
import playButtonImg from '../assets/icons/play-button.png';
import pauseImg from '../assets/icons/pause.png';

const FALLBACK_COVER = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="160" height="160"%3E%3Crect fill="%23282828" width="160" height="160"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23535353" font-size="48"%3E%F0%9F%8E%B5%3C/text%3E%3C/svg%3E';

function TrackMenu({ playlistId, trackId, trackTitle, onRemoved, onShare }: {
  playlistId: string;
  trackId: string;
  trackTitle: string;
  onRemoved: (trackId: string) => void;
  onShare: (trackId: string, title: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleRemove = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setLoading(true);
    try {
      await apiService.removeTrackFromPlaylist(playlistId, trackId);
      onRemoved(trackId);
    } catch {
      // silent
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  return (
    <div style={{ position: 'relative' }} ref={menuRef} onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen(v => !v)}
        title="More options"
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          padding: '4px 6px', borderRadius: '4px',
          color: '#b3b3b3', fontSize: '1rem', lineHeight: 1,
          transition: 'color 0.15s, background 0.15s',
          display: 'flex', alignItems: 'center',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = '#fff';
          e.currentTarget.style.background = '#3e3e3e';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = '#b3b3b3';
          e.currentTarget.style.background = 'none';
        }}
      >
        •••
      </button>

      {open && (
        <div style={{
          position: 'absolute', right: 0, top: '30px',
          backgroundColor: '#282828',
          borderRadius: '6px',
          minWidth: '160px',
          zIndex: 100,
          boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
          overflow: 'hidden',
        }}>
          <button
            onClick={(e) => { e.stopPropagation(); setOpen(false); onShare(trackId, trackTitle); }}
            style={{
              display: 'block', width: '100%', textAlign: 'left',
              padding: '10px 14px', background: 'none', border: 'none',
              color: '#fff', fontSize: '0.875rem', cursor: 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#3e3e3e'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
          >
            Chia sẻ bài hát
          </button>
          <button
            onClick={handleRemove}
            disabled={loading}
            style={{
              display: 'block', width: '100%', textAlign: 'left',
              padding: '10px 14px', background: 'none', border: 'none',
              color: '#ff6b6b', fontSize: '0.875rem', cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s',
              opacity: loading ? 0.6 : 1,
              borderTop: '1px solid #3e3e3e',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#3e3e3e'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
          >
            {loading ? 'Removing...' : 'Remove from playlist'}
          </button>
        </div>
      )}
    </div>
  );
}

export default function PlaylistPage() {
  const { id } = useParams<{ id: string }>();
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [tracks, setTracks] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shareTarget, setShareTarget] = useState<{ id: string; title: string } | null>(null);

  const { currentSong, isPlaying, setQueue } = useMusic();

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    apiService.getPlaylist(id)
      .then((data) => {
        setPlaylist(data);
        setTracks(data.tracks ?? []);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load playlist'))
      .finally(() => setIsLoading(false));
  }, [id]);

  const handleTrackRemoved = (trackId: string) => {
    setTracks(prev => prev.filter(t => t.id !== trackId));
    setPlaylist(prev => prev ? { ...prev, trackCount: (prev.trackCount ?? 1) - 1 } : prev);
  };

  if (isLoading) {
    return (
      <div style={{ padding: '2rem' }}>
        <h2 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#fff' }}>
          Playlist
        </h2>
        <p style={{ color: '#b3b3b3' }}>Loading...</p>
      </div>
    );
  }

  if (error || !playlist) {
    return (
      <div style={{ padding: '2rem' }}>
        <h2 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#fff' }}>
          Playlist
        </h2>
        <p style={{ color: '#dc2626' }}>{error || 'Playlist not found'}</p>
      </div>
    );
  }

  // Cover = ảnh track đầu tiên, fallback nếu không có
  const coverSrc = tracks[0]?.cover || playlist.cover || FALLBACK_COVER;

  const handlePlayAll = () => {
    if (tracks.length > 0) setQueue(tracks, 0);
  };

  return (
    <div className={styles.container}>
      {/* Header section */}
      <div className={styles.headerRow}>
        <img src={coverSrc} alt={playlist.title} className={styles.cover} onError={(e) => { e.currentTarget.src = FALLBACK_COVER; }} />
        <div>
          <p className={styles.metaTitle}>Playlist</p>
          <h2 className={styles.playlistTitle}>{playlist.title}</h2>
          {playlist.description && (<p className={styles.playlistDesc}>{playlist.description}</p>)}
          <p className={styles.playCount}>{tracks.length} track{tracks.length !== 1 ? 's' : ''}</p>
          {tracks.length > 0 && (
            <button onClick={handlePlayAll} className={styles.playBtn} onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#1ed760'; (e.currentTarget as HTMLElement).style.transform = 'scale(1.03)'; }} onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#1db954'; (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}>
              <img src={playButtonImg} alt="Play" style={{ width: '14px', height: '14px' }} />
              Play All
            </button>
          )}
        </div>
      </div>

      {/* Track list */}
      {tracks.length === 0 ? (
        <div className={styles.emptyCard}><p style={{ color: '#b3b3b3', margin: 0 }}>No tracks yet — add songs via the + button in the player while a song is playing.</p></div>
      ) : (
        <div className={styles.trackTable}>
          <div className={styles.tableHeader}>
            <span style={{ fontSize: '0.72rem', color: '#6b6b6b', textAlign: 'center' }}>#</span>
            <span style={{ fontSize: '0.72rem', color: '#6b6b6b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Title</span>
            <span />
          </div>

          {tracks.map((track, idx) => {
            const isActive = currentSong?.id === track.id;
            return (
              <div key={track.id} onClick={() => setQueue(tracks, idx)} className={styles.trackRow} style={{ backgroundColor: isActive ? 'rgba(29,185,84,0.1)' : 'transparent' }} onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = '#282828'; }} onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = isActive ? 'rgba(29,185,84,0.1)' : 'transparent'; }}>
                <div className={styles.indexCol}>
                  {isActive ? (<img src={isPlaying ? pauseImg : playButtonImg} alt="" style={{ width: '14px', height: '14px' }} />) : (<span style={{ fontSize: '0.8rem', color: '#b3b3b3' }}>{idx + 1}</span>)}
                </div>

                <div className={styles.titleCol}>
                  <p className={styles.trackTitle} style={{ color: isActive ? '#1db954' : '#fff' }}>{track.title}</p>
                  <p className={styles.trackArtist}>{track.artist}</p>
                </div>

                {id && (<TrackMenu playlistId={id} trackId={track.id} trackTitle={track.title} onRemoved={handleTrackRemoved} onShare={(tid, title) => setShareTarget({ id: tid, title })} />)}
              </div>
            );
          })}
        </div>
      )}

      {shareTarget && (
        <ShareModal mediaItemId={shareTarget.id} title={shareTarget.title} onClose={() => setShareTarget(null)} />
      )}
    </div>
  );
}
