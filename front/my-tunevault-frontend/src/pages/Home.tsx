import { useState, useEffect } from 'react';
import { useMusic } from '../hooks/MusicContext';
import apiService from '../services/ApiService';
import type { Song } from '../types';
import ShareModal from '../components/ShareModal';
import playButtonImg from '../assets/icons/play-button.png';
import pauseImg from '../assets/icons/pause.png';

const FALLBACK_COVER = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="180" height="180"%3E%3Crect fill="%23282828" width="180" height="180"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23b3b3b3" font-size="40"%3E%F0%9F%8E%B5%3C/text%3E%3C/svg%3E';

function TrackCard({ song, index, songs, onShare }: {
  song: Song;
  index: number;
  songs: Song[];
  onShare: (song: Song) => void;
}) {
  const { currentSong, isPlaying, setQueue } = useMusic();
  const isActive = currentSong?.id === song.id;
  const [hovered, setHovered] = useState(false);

  return (
    <div
      style={{
        cursor: 'pointer',
        textAlign: 'center',
        transition: 'transform 0.3s, box-shadow 0.3s',
        transform: isActive ? 'scale(1.05)' : hovered ? 'scale(1.08)' : 'scale(1)',
        boxShadow: isActive ? '0 0 20px rgba(29,185,84,0.6)' : '0 4px 12px rgba(0,0,0,0.3)',
        borderRadius: '8px',
        overflow: 'hidden',
        position: 'relative',
        flex: 1,
        minWidth: '140px',
        maxWidth: '220px',
      }}
      onClick={() => setQueue(songs, index)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <img
        src={song.cover || FALLBACK_COVER}
        alt={song.title}
        style={{ width: '100%', height: '180px', objectFit: 'cover', display: 'block' }}
        onError={(e) => { e.currentTarget.src = FALLBACK_COVER; }}
      />

      {/* Hover / active overlay */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: '56px',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
        backgroundColor: 'rgba(0,0,0,0.6)',
        opacity: isActive || hovered ? 1 : 0,
        transition: 'opacity 0.2s',
      }}>
        <img
          src={isActive && isPlaying ? pauseImg : playButtonImg}
          alt={isActive && isPlaying ? 'Pause' : 'Play'}
          style={{ width: '36px', height: '36px' }}
        />
        {/* Share button */}
        <button
          onClick={(e) => { e.stopPropagation(); onShare(song); }}
          title="Share"
          style={{
            width: '32px', height: '32px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.15)',
            border: '1px solid rgba(255,255,255,0.35)',
            color: '#fff', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.8rem', fontWeight: 700,
          }}
        >
          ↗
        </button>
      </div>

      <div style={{ padding: '0.75rem 1rem', backgroundColor: '#282828' }}>
        <p style={{ fontWeight: 'bold', fontSize: '0.875rem', margin: '0.25rem 0', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {song.title}
        </p>
        <p style={{ fontSize: '0.75rem', margin: 0, color: '#b3b3b3', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {song.artist}
        </p>
      </div>
    </div>
  );
}

export default function Home() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shareTarget, setShareTarget] = useState<Song | null>(null);

  useEffect(() => {
    apiService.getSongs()
      .then(setSongs)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <p style={{ color: '#b3b3b3', padding: '2rem' }}>Loading music...</p>;
  if (error) return <p style={{ color: '#dc2626', padding: '2rem' }}>Error: {error}</p>;
  if (songs.length === 0) return <p style={{ color: '#b3b3b3', padding: '2rem' }}>No music available</p>;

  const firstHalf = songs.slice(0, Math.ceil(songs.length / 2));
  const secondHalf = songs.slice(Math.ceil(songs.length / 2));

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem', padding: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#fff' }}>
            🎵 Featured Tracks
          </h2>
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            {firstHalf.map((song, idx) => (
              <TrackCard key={song.id} song={song} index={idx} songs={songs} onShare={setShareTarget} />
            ))}
          </div>
        </div>

        {secondHalf.length > 0 && (
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#fff' }}>
              🎸 More Tracks
            </h2>
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
              {secondHalf.map((song, idx) => (
                <TrackCard key={song.id} song={song} index={firstHalf.length + idx} songs={songs} onShare={setShareTarget} />
              ))}
            </div>
          </div>
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
