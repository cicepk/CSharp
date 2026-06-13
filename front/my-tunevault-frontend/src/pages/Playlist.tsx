import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import apiService from '../services/ApiService';
import { useMusic } from '../hooks/MusicContext';
import type { Playlist, Song } from '../types';
import playButtonImg from '../assets/icons/play-button.png';
import pauseImg from '../assets/icons/pause.png';

const FALLBACK_COVER = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="56" height="56"%3E%3Crect fill="%23282828" width="56" height="56"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23b3b3b3" font-size="24"%3E%F0%9F%8E%B5%3C/text%3E%3C/svg%3E';

export default function PlaylistPage() {
  const { id } = useParams<{ id: string }>();
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { currentSong, isPlaying, setQueue } = useMusic();

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    apiService.getPlaylist(id)
      .then(setPlaylist)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load playlist'))
      .finally(() => setIsLoading(false));
  }, [id]);

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

  const tracks: Song[] = playlist.tracks ?? [];

  const handlePlayAll = () => {
    if (tracks.length > 0) setQueue(tracks, 0);
  };

  return (
    <div style={{ padding: '2rem' }}>
      {/* Header section */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Playlist cover */}
        <img
          src={playlist.cover || FALLBACK_COVER}
          alt={playlist.title}
          style={{ width: '160px', height: '160px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0 }}
          onError={(e) => { e.currentTarget.src = FALLBACK_COVER; }}
        />
        <div>
          <p style={{ margin: '0 0 4px', fontSize: '0.75rem', color: '#b3b3b3', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Playlist
          </p>
          <h2 style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0 0 8px', color: '#fff' }}>
            {playlist.title}
          </h2>
          {playlist.description && (
            <p style={{ margin: '0 0 8px', fontSize: '0.875rem', color: '#b3b3b3' }}>
              {playlist.description}
            </p>
          )}
          <p style={{ margin: '0 0 16px', fontSize: '0.8rem', color: '#b3b3b3' }}>
            {tracks.length} track{tracks.length !== 1 ? 's' : ''}
          </p>
          {tracks.length > 0 && (
            <button
              onClick={handlePlayAll}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px 24px',
                backgroundColor: '#1db954',
                border: 'none', borderRadius: '20px',
                color: '#000', fontSize: '0.875rem', fontWeight: 700,
                cursor: 'pointer', transition: 'background-color 0.15s, transform 0.1s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#1ed760';
                e.currentTarget.style.transform = 'scale(1.03)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#1db954';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <img src={playButtonImg} alt="Play" style={{ width: '14px', height: '14px' }} />
              Play All
            </button>
          )}
        </div>
      </div>

      {/* Track list */}
      {tracks.length === 0 ? (
        <div style={{
          padding: '2rem',
          backgroundColor: '#282828',
          borderRadius: '8px',
          textAlign: 'center',
        }}>
          <p style={{ color: '#b3b3b3', margin: 0 }}>
            No tracks yet — add songs via the + button in the player while a song is playing.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {/* Column headers */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '40px 1fr auto',
            padding: '0 12px 8px',
            borderBottom: '1px solid #282828',
          }}>
            <span style={{ fontSize: '0.72rem', color: '#6b6b6b', textAlign: 'center' }}>#</span>
            <span style={{ fontSize: '0.72rem', color: '#6b6b6b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Title</span>
            <span style={{ fontSize: '0.72rem', color: '#6b6b6b' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#6b6b6b">
                <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm4.24 16L12 15.45 7.77 18l1.12-4.81-3.73-3.23 4.92-.42L12 5l1.92 4.53 4.92.42-3.73 3.23L16.23 18z"/>
              </svg>
            </span>
          </div>

          {tracks.map((track, idx) => {
            const isActive = currentSong?.id === track.id;
            return (
              <div
                key={track.id}
                onClick={() => setQueue(tracks, idx)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '40px 1fr auto',
                  alignItems: 'center',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  backgroundColor: isActive ? 'rgba(29,185,84,0.1)' : 'transparent',
                  transition: 'background-color 0.15s',
                  gap: '8px',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = '#282828';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = isActive ? 'rgba(29,185,84,0.1)' : 'transparent';
                }}
              >
                {/* Index / play indicator */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {isActive ? (
                    <img
                      src={isPlaying ? pauseImg : playButtonImg}
                      alt={isPlaying ? 'Playing' : 'Paused'}
                      style={{ width: '14px', height: '14px', filter: 'invert(1) sepia(1) saturate(5) hue-rotate(80deg)' }}
                    />
                  ) : (
                    <span style={{ fontSize: '0.8rem', color: '#b3b3b3' }}>{idx + 1}</span>
                  )}
                </div>

                {/* Title + artist */}
                <div style={{ overflow: 'hidden' }}>
                  <p style={{
                    margin: 0, fontSize: '0.875rem', fontWeight: 600,
                    color: isActive ? '#1db954' : '#fff',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {track.title}
                  </p>
                  <p style={{
                    margin: '2px 0 0', fontSize: '0.75rem', color: '#b3b3b3',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {track.artist}
                  </p>
                </div>

                {/* Play icon on hover (placeholder for duration) */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                  <img
                    src={playButtonImg}
                    alt="Play"
                    style={{
                      width: '14px', height: '14px',
                      opacity: isActive ? 0 : 0.4,
                      filter: 'invert(1)',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
