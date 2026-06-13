import { useState, useEffect } from 'react';
import { useMusic } from '../hooks/MusicContext';
import apiService from '../services/ApiService';
import type { Song } from '../types';
import playButtonImg from '../assets/icons/play-button.png';
import pauseImg from '../assets/icons/pause.png';

const FALLBACK_COVER = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="180" height="180"%3E%3Crect fill="%23282828" width="180" height="180"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23b3b3b3" font-size="40"%3E%F0%9F%8E%B5%3C/text%3E%3C/svg%3E';

function TrackCard({ song, index, songs }: { song: Song; index: number; songs: Song[] }) {
  const { currentSong, isPlaying, setQueue } = useMusic();
  const isActive = currentSong?.id === song.id;

  return (
    <div
      onClick={() => setQueue(songs, index)}
      style={{
        cursor: 'pointer',
        textAlign: 'center',
        transition: 'transform 0.3s, box-shadow 0.3s',
        transform: isActive ? 'scale(1.05)' : 'scale(1)',
        boxShadow: isActive ? '0 0 20px rgba(29,185,84,0.6)' : '0 4px 12px rgba(0,0,0,0.3)',
        borderRadius: '8px',
        overflow: 'hidden',
        position: 'relative',
        flex: 1,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.08)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = isActive ? 'scale(1.05)' : 'scale(1)'; }}
    >
      <img
        src={song.cover || FALLBACK_COVER}
        alt={song.title}
        style={{ width: '100%', height: '180px', objectFit: 'cover', display: 'block' }}
        onError={(e) => { e.currentTarget.src = FALLBACK_COVER; }}
      />
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
        opacity: isActive ? 1 : 0,
        transition: 'opacity 0.3s',
      }}>
        <img
          src={isActive && isPlaying ? pauseImg : playButtonImg}
          alt={isActive && isPlaying ? 'Pause' : 'Play'}
          style={{ width: '40px', height: '40px' }}
        />
      </div>
      <div style={{ padding: '1rem', backgroundColor: '#282828' }}>
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem', padding: '2rem' }}>
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#fff' }}>
          🎵 Featured Tracks
        </h2>
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          {firstHalf.map((song, idx) => (
            <TrackCard key={song.id} song={song} index={idx} songs={songs} />
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
              <TrackCard key={song.id} song={song} index={firstHalf.length + idx} songs={songs} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
