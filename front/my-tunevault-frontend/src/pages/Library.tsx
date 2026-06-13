import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/ApiService';
import type { Playlist } from '../types';

const FALLBACK_COVER = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="180" height="180"%3E%3Crect fill="%23282828" width="180" height="180"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23b3b3b3" font-size="30"%3E%F0%9F%8E%B5%3C/text%3E%3C/svg%3E';

export default function Library() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Create playlist form state
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    apiService.getPlaylists()
      .then(setPlaylists)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load playlists'))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (showForm) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [showForm]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = formName.trim();
    if (!name) { setFormError('Name is required'); return; }
    setFormLoading(true);
    setFormError('');
    try {
      const newPl = await apiService.createPlaylist(name);
      setPlaylists(prev => [newPl, ...prev]);
      setShowForm(false);
      setFormName('');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create playlist');
    } finally {
      setFormLoading(false);
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setFormName('');
    setFormError('');
  };

  if (isLoading) {
    return (
      <div style={{ padding: '2rem' }}>
        <h2 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#fff' }}>
          Your Library
        </h2>
        <p style={{ color: '#b3b3b3' }}>Loading playlists...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem' }}>
        <h2 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#fff' }}>
          Your Library
        </h2>
        <p style={{ color: '#dc2626' }}>Error: {error}</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', padding: '2rem' }}>
      {/* Title row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: showForm ? '1rem' : '1.5rem' }}>
        <h2 style={{ fontSize: '1.875rem', fontWeight: 'bold', margin: 0, color: '#fff' }}>
          Your Library
        </h2>
        <button
          onClick={() => { setShowForm(v => !v); setFormError(''); }}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '8px 16px',
            backgroundColor: '#1db954',
            border: 'none', borderRadius: '20px',
            color: '#000', fontSize: '0.875rem', fontWeight: 700,
            cursor: 'pointer', transition: 'background-color 0.15s, transform 0.1s',
            flexShrink: 0,
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
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
          </svg>
          New Playlist
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '14px 16px',
            backgroundColor: '#282828',
            borderRadius: '8px',
            marginBottom: '1.5rem',
          }}
        >
          <input
            ref={inputRef}
            type="text"
            placeholder="Playlist name..."
            value={formName}
            onChange={(e) => { setFormName(e.target.value); setFormError(''); }}
            maxLength={80}
            style={{
              flex: 1,
              padding: '8px 12px',
              backgroundColor: '#3e3e3e',
              border: formError ? '1px solid #e53e3e' : '1px solid transparent',
              borderRadius: '4px',
              color: '#fff', fontSize: '0.875rem',
              outline: 'none',
            }}
            onFocus={(e) => e.currentTarget.style.border = '1px solid #1db954'}
            onBlur={(e) => { e.currentTarget.style.border = formError ? '1px solid #e53e3e' : '1px solid transparent'; }}
          />
          {formError && (
            <span style={{ fontSize: '0.75rem', color: '#e53e3e', flexShrink: 0 }}>{formError}</span>
          )}
          <button
            type="submit"
            disabled={formLoading}
            style={{
              padding: '8px 18px',
              backgroundColor: '#1db954',
              border: 'none', borderRadius: '4px',
              color: '#000', fontSize: '0.875rem', fontWeight: 700,
              cursor: formLoading ? 'not-allowed' : 'pointer',
              opacity: formLoading ? 0.7 : 1,
              flexShrink: 0,
            }}
          >
            {formLoading ? 'Creating...' : 'Create'}
          </button>
          <button
            type="button"
            onClick={handleCancelForm}
            style={{
              padding: '8px 14px',
              backgroundColor: 'transparent',
              border: '1px solid #535353', borderRadius: '4px',
              color: '#b3b3b3', fontSize: '0.875rem',
              cursor: 'pointer', flexShrink: 0,
            }}
          >
            Cancel
          </button>
        </form>
      )}

      {/* Playlists grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        gap: '1rem',
      }}>
        {playlists.length === 0 ? (
          <div style={{
            gridColumn: '1 / -1',
            padding: '2rem',
            backgroundColor: '#282828',
            borderRadius: '8px',
            textAlign: 'center',
          }}>
            <p style={{ color: '#b3b3b3', margin: 0 }}>No playlists yet — create one above!</p>
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
                overflow: 'hidden',
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
                src={playlist.cover || FALLBACK_COVER}
                alt={playlist.title}
                style={{ width: '100%', height: '180px', objectFit: 'cover', display: 'block' }}
                onError={(e) => { e.currentTarget.src = FALLBACK_COVER; }}
              />
              <div style={{ padding: '1rem' }}>
                <p style={{
                  fontWeight: 'bold', fontSize: '0.875rem',
                  margin: '0.5rem 0',
                  color: '#fff',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {playlist.title}
                </p>
                <p style={{ fontSize: '0.75rem', margin: 0, color: '#b3b3b3' }}>
                  {playlist.trackCount ?? playlist.tracks?.length ?? 0} tracks
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
