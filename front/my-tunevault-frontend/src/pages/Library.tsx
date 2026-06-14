import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/ApiService';
import styles from './Library.module.css';
import type { Playlist } from '../types';

async function handleToggleVisibility(
  playlist: Playlist,
  setPlaylists: React.Dispatch<React.SetStateAction<Playlist[]>>,
  e: React.MouseEvent
) {
  e.stopPropagation();
  const newVal = !playlist.isPublic;
  try {
    await apiService.togglePlaylistVisibility(playlist.id, newVal);
    setPlaylists(prev => prev.map(p => p.id === playlist.id ? { ...p, isPublic: newVal } : p));
  } catch { /* silent */ }
}

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
    let mounted = true;
    (async () => {
      try {
        const pls = await apiService.getPlaylists();
        if (!mounted) return;
        setPlaylists(pls);

        const hasFav = pls.some(p => /favorite(s)?/i.test(p.title));
        if (!hasFav) {
          try {
            const newPl = await apiService.createPlaylist('Favorite');
            if (!mounted) return;
            setPlaylists(prev => [newPl, ...prev]);
          } catch { /* silent */ }
        }
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : 'Failed to load playlists');
      } finally {
        if (!mounted) return;
        setIsLoading(false);
      }
    })();
    return () => { mounted = false; };
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
        <h2 className={styles.title}>Your Library</h2>
        <p style={{ color: '#b3b3b3' }}>Loading playlists...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem' }}>
        <h2 className={styles.title}>Your Library</h2>
        <p style={{ color: '#dc2626' }}>Error: {error}</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Title row */}
      <div className={styles.titleRow} style={{ marginBottom: showForm ? '1rem' : '1.5rem' }}>
        <h2 className={styles.title}>Your Library</h2>
        <button onClick={() => { setShowForm(v => !v); setFormError(''); }} className={styles.newBtn} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1ed760'; e.currentTarget.style.transform = 'scale(1.03)'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#1db954'; e.currentTarget.style.transform = 'scale(1)'; }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
          New Playlist
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate} className={styles.form}>
          <input ref={inputRef} type="text" placeholder="Playlist name..." value={formName} onChange={(e) => { setFormName(e.target.value); setFormError(''); }} maxLength={80} className={styles.input} onFocus={(e) => e.currentTarget.style.border = '1px solid #1db954'} onBlur={(e) => { e.currentTarget.style.border = formError ? '1px solid #e53e3e' : '1px solid transparent'; }} />
          {formError && (<span style={{ fontSize: '0.75rem', color: '#e53e3e', flexShrink: 0 }}>{formError}</span>)}
          <button type="submit" disabled={formLoading} className={styles.newBtn} style={{ padding: '8px 18px', borderRadius: '4px' }}>{formLoading ? 'Creating...' : 'Create'}</button>
          <button type="button" onClick={handleCancelForm} className={styles.newBtn} style={{ backgroundColor: 'transparent', border: '1px solid #535353', color: '#b3b3b3', padding: '8px 14px' }}>Cancel</button>
        </form>
      )}

      {/* Playlists grid */}
      <div className={styles.grid}>
        {playlists.length === 0 ? (
          <div className={styles.emptyCard}><p style={{ color: '#b3b3b3', margin: 0 }}>No playlists yet — create one above!</p></div>
        ) : (
          playlists.map((playlist) => (
            <div key={playlist.id} onClick={() => navigate(`/playlist/${playlist.id}`)} className={styles.card} onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#1db954'; (e.currentTarget as HTMLElement).style.transform = 'scale(1.05)'; }} onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#282828'; (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}>
              <img src={playlist.cover || FALLBACK_COVER} alt={playlist.title} className={styles.cardImg} onError={(e) => { e.currentTarget.src = FALLBACK_COVER; }} />
              <div className={styles.cardBody}>
                <p className={styles.cardTitle}>{playlist.title}</p>
                <div className={styles.cardRow}>
                  <p style={{ fontSize: '0.75rem', margin: 0, color: '#b3b3b3' }}>{playlist.trackCount ?? playlist.tracks?.length ?? 0} tracks</p>
                  <button onClick={(e) => handleToggleVisibility(playlist, setPlaylists, e)} title={playlist.isPublic ? 'Make private' : 'Make public'} className={styles.toggleBtn} style={{ backgroundColor: playlist.isPublic ? 'rgba(29,185,84,0.2)' : 'rgba(255,255,255,0.1)', color: playlist.isPublic ? '#1db954' : '#b3b3b3' }} onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.7'; }} onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}>{playlist.isPublic ? 'Public' : 'Private'}</button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
