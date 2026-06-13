import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import apiService from '../services/ApiService';
import type { Playlist } from '../types';

export default function PlaylistPage() {
  const { id } = useParams<{ id: string }>();
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlaylist = async () => {
      if (!id) return;
      try {
        setIsLoading(true);
        const data = await apiService.getPlaylist(id);
        setPlaylist(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load playlist');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlaylist();
  }, [id]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <h2 style={{
          fontSize: '1.875rem',
          fontWeight: 'bold',
          marginBottom: '1.5rem',
          color: '#fff'
        }}>
          Playlist
        </h2>
        <p style={{ color: '#b3b3b3' }}>Loading...</p>
      </div>
    );
  }

  if (error || !playlist) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <h2 style={{
          fontSize: '1.875rem',
          fontWeight: 'bold',
          marginBottom: '1.5rem',
          color: '#fff'
        }}>
          Playlist
        </h2>
        <p style={{ color: '#dc2626' }}>{error || 'Playlist not found'}</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <h2 style={{
        fontSize: '1.875rem',
        fontWeight: 'bold',
        marginBottom: '1.5rem',
        color: '#fff'
      }}>
        {playlist.title}
      </h2>
      {playlist.description && (
        <p style={{
          fontSize: '0.875rem',
          color: '#b3b3b3',
          marginBottom: '1rem'
        }}>
          {playlist.description}
        </p>
      )}
      <div style={{
        backgroundColor: '#282828',
        padding: '1.5rem',
        borderRadius: '8px'
      }}>
        {playlist.tracks && playlist.tracks.length > 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}>
            {playlist.tracks.map((track) => (
              <div
                key={track.id}
                style={{
                  padding: '0.75rem',
                  backgroundColor: '#181818',
                  borderRadius: '4px',
                  color: '#fff'
                }}
              >
                <p style={{ margin: 0, fontWeight: 'bold' }}>{track.title}</p>
                <p style={{ margin: '0.25rem 0 0 0', color: '#b3b3b3', fontSize: '0.875rem' }}>
                  {track.artist}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: '#b3b3b3', margin: 0 }}>No tracks in this playlist</p>
        )}
      </div>
    </div>
  );
}
