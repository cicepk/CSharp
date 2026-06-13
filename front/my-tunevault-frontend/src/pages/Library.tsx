import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/ApiService';
import type { Playlist } from '../types';

export default function Library() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPlaylists = async () => {
      try {
        setIsLoading(true);
        const items = await apiService.getPlaylists();
        setPlaylists(items);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load playlists');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlaylists();
  }, []);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <h2 style={{
          fontSize: '1.875rem',
          fontWeight: 'bold',
          marginBottom: '1.5rem',
          color: '#fff'
        }}>
          Your Library
        </h2>
        <p style={{ color: '#b3b3b3' }}>Loading playlists...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <h2 style={{
          fontSize: '1.875rem',
          fontWeight: 'bold',
          marginBottom: '1.5rem',
          color: '#fff'
        }}>
          Your Library
        </h2>
        <p style={{ color: '#dc2626' }}>Error: {error}</p>
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
        Your Library
      </h2>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        gap: '1rem'
      }}>
        {playlists.length === 0 ? (
          <div style={{
            backgroundColor: '#282828',
            padding: '1rem',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#333'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#282828'}
          >
            <p style={{ color: '#b3b3b3', margin: 0 }}>No playlists yet</p>
          </div>
        ) : (
          playlists.map((playlist) => (
            <div
              key={playlist.id}
              onClick={() => navigate(`/playlist/${playlist.id}`)}
              style={{
                backgroundColor: '#282828',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#1db954';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#282828';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <img
                src={playlist.cover}
                alt={playlist.title}
                style={{
                  width: '100%',
                  height: '180px',
                  objectFit: 'cover',
                  display: 'block'
                }}
                onError={(e) => {
                  e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="180" height="180"%3E%3Crect fill="%23282828" width="180" height="180"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23b3b3b3" font-size="30"%3E📚%3C/text%3E%3C/svg%3E';
                }}
              />
              <div style={{ padding: '1rem' }}>
                <p style={{
                  fontWeight: 'bold',
                  fontSize: '0.875rem',
                  margin: '0.5rem 0',
                  color: '#fff',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {playlist.title}
                </p>
                <p style={{
                  fontSize: '0.75rem',
                  margin: 0,
                  color: '#b3b3b3'
                }}>
                  {playlist.tracks?.length || 0} tracks
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
