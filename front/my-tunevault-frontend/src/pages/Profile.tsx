import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/ApiService';
import styles from './Profile.module.css';
import type { Playlist } from '../types';

const FALLBACK_COVER = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="160" height="160"%3E%3Crect fill="%23282828" width="160" height="160"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23535353" font-size="48"%3E%F0%9F%8E%B5%3C/text%3E%3C/svg%3E';

export default function Profile() {
  const { user, refreshUser, setUser } = useAuth();
  const navigate = useNavigate();

  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loadingPlaylists, setLoadingPlaylists] = useState(true);

  // Edit mode
  const [editing, setEditing] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editError, setEditError] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  // Avatar upload
  const [avatarLoading, setAvatarLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    apiService.getPlaylists()
      .then(setPlaylists)
      .catch(() => {})
      .finally(() => setLoadingPlaylists(false));
  }, []);

  const openEdit = () => {
    setEditUsername(user?.username ?? '');
    setEditEmail(user?.email ?? '');
    setEditBio(user?.bio ?? '');
    setEditError('');
    setEditing(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const username = editUsername.trim();
    const email = editEmail.trim();
    const bio = editBio.trim();

    if (username.length < 3) { setEditError('Username must be at least 3 characters'); return; }
    if (!email.includes('@')) { setEditError('Invalid email format'); return; }
    if (bio.length > 300) { setEditError('Bio must be 300 characters or less'); return; }

    setEditLoading(true);
    setEditError('');
    try {
      await apiService.updateProfile(username, email, bio || undefined);
      await refreshUser();
      setEditing(false);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setEditLoading(false);
    }
  };

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setAvatarLoading(true);
    try {
      const avatarUrl = await apiService.uploadAvatar(file);
      setUser({ ...user, avatarUrl });
    } catch { /* silent */ } finally {
      setAvatarLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleToggleVisibility = async (playlist: Playlist, e: React.MouseEvent) => {
    e.stopPropagation();
    const newVal = !playlist.isPublic;
    try {
      await apiService.togglePlaylistVisibility(playlist.id, newVal);
      setPlaylists(prev => prev.map(p => p.id === playlist.id ? { ...p, isPublic: newVal } : p));
    } catch { /* silent */ }
  };

  const publicCount = playlists.filter(p => p.isPublic).length;
  const initial = user?.username?.[0]?.toUpperCase() ?? '?';

  // Gradient header background (Spotify-style: avatar color → dark)
  const gradientBg = 'linear-gradient(180deg, #b8860b 0%, #4a3800 40%, #121212 100%)';

  return (
    <div className={styles.container}>
      <div className={styles.hero} style={{ background: gradientBg }}>
        <div className={styles.heroInner}>
          <div onClick={handleAvatarClick} title="Change avatar" className={styles.avatarBox}>
            {user?.avatarUrl ? (<img src={user.avatarUrl} alt={user.username} className={styles.avatarImg} />) : (<div className={styles.avatarInitial}>{initial}</div>)}
            <div className={`${styles.avatarOverlay} ${avatarLoading ? 'show' : ''}`} onMouseEnter={(e) => { if (!avatarLoading) (e.currentTarget as HTMLElement).style.opacity = '1'; }} onMouseLeave={(e) => { if (!avatarLoading) (e.currentTarget as HTMLElement).style.opacity = '0'; }}>
              {avatarLoading ? (<span style={{ fontSize: '0.75rem', color: '#fff' }}>Uploading...</span>) : (<><svg width="32" height="32" viewBox="0 0 24 24" fill="#fff"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg><span style={{ fontSize: '0.7rem', color: '#fff', marginTop: '4px' }}>Change photo</span></>) }
            </div>
          </div>

          <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.webp" style={{ display: 'none' }} onChange={handleAvatarChange} />

          <div className={styles.info}>
            <p className={styles.meta}>Profile</p>
            <h1 className={styles.displayName} style={{ fontSize: user && user.username.length > 12 ? '2.5rem' : '3.5rem' }}>{user?.username}</h1>
            {user?.bio && (<p className={styles.bio}>{user.bio}</p>)}
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}><span style={{ color: '#fff', fontWeight: 700 }}>{publicCount}</span> Public Playlists · <span style={{ color: '#fff', fontWeight: 700 }}>{user?.followingCount ?? 0}</span> Following · <span style={{ color: '#fff', fontWeight: 700 }}>{user?.followerCount ?? 0}</span> Followers</p>
          </div>
        </div>
      </div>

      <div className={styles.actionsBar}>
        <button onClick={openEdit} className={`${styles.btn} ${styles.editBtn}`} onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#fff'; }} onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#535353'; }}>Edit profile</button>
        <button onClick={() => navigate(-1)} className={`${styles.btn} ${styles.backBtn}`} onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#fff'; }} onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#b3b3b3'; }}>Back</button>
      </div>

      {editing && (
        <div className={styles.modalOverlay} onClick={() => setEditing(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 1.5rem', fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>Edit profile</h2>
            <form onSubmit={handleSaveProfile}>
              <div className={styles.formCol}>
                <label className={styles.formLabel}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#b3b3b3' }}>Username</span>
                  <input type="text" value={editUsername} onChange={(e) => { setEditUsername(e.target.value); setEditError(''); }} maxLength={50} className={styles.formInput} onFocus={(e) => (e.currentTarget as HTMLElement).style.border = '1px solid #1db954'} onBlur={(e) => (e.currentTarget as HTMLElement).style.border = '1px solid #535353'} />
                </label>

                <label className={styles.formLabel}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#b3b3b3' }}>Email</span>
                  <input type="email" value={editEmail} onChange={(e) => { setEditEmail(e.target.value); setEditError(''); }} maxLength={100} className={styles.formInput} onFocus={(e) => (e.currentTarget as HTMLElement).style.border = '1px solid #1db954'} onBlur={(e) => (e.currentTarget as HTMLElement).style.border = '1px solid #535353'} />
                </label>

                <label className={styles.formLabel}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#b3b3b3' }}>Bio <span style={{ fontWeight: 400, color: '#535353' }}>({editBio.length}/300)</span></span>
                  <textarea value={editBio} onChange={(e) => { setEditBio(e.target.value); setEditError(''); }} maxLength={300} rows={3} placeholder="Write a little about yourself..." className={styles.formInput} style={{ resize: 'none', lineHeight: 1.5 }} onFocus={(e) => (e.currentTarget as HTMLElement).style.border = '1px solid #1db954'} onBlur={(e) => (e.currentTarget as HTMLElement).style.border = '1px solid #535353'} />
                </label>
              </div>

              {editError && (<p style={{ margin: '0.75rem 0 0', fontSize: '0.8rem', color: '#e53e3e' }}>{editError}</p>)}

              <div className={styles.formActions}>
                <button type="button" onClick={() => setEditing(false)} className={`${styles.btn} ${styles.editBtn}`}>Cancel</button>
                <button type="submit" disabled={editLoading} className={styles.btn} style={{ padding: '10px 24px', border: 'none', backgroundColor: '#fff', color: '#000', fontWeight: 700, opacity: editLoading ? 0.7 : 1 }} onMouseEnter={(e) => { if (!editLoading) (e.currentTarget as HTMLElement).style.backgroundColor = '#e0e0e0'; }} onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#fff'; }}>{editLoading ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className={styles.playlistsSection}>
        <h2 className={styles.playlistTitle}>Playlists</h2>
        {loadingPlaylists ? (<p style={{ color: '#b3b3b3' }}>Loading...</p>) : playlists.length === 0 ? (<p style={{ color: '#b3b3b3' }}>No playlists yet.</p>) : (
          <div className={styles.grid}>{playlists.map(playlist => (
            <div key={playlist.id} className={styles.card} onClick={() => navigate(`/playlist/${playlist.id}`)} onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = '#333'} onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = '#282828'}>
              <img src={playlist.cover || FALLBACK_COVER} alt={playlist.title} className={styles.cardImg} onError={(e) => { e.currentTarget.src = FALLBACK_COVER; }} />
              <div className={styles.cardBody}><p className={styles.cardTitle}>{playlist.title}</p><div className={styles.cardRow}><p style={{ fontSize: '0.75rem', margin: 0, color: '#b3b3b3' }}>{playlist.trackCount ?? 0} tracks</p><button onClick={(e) => handleToggleVisibility(playlist, e)} title={playlist.isPublic ? 'Make private' : 'Make public'} className={styles.toggleBtn} style={{ backgroundColor: playlist.isPublic ? 'rgba(29,185,84,0.2)' : 'rgba(255,255,255,0.1)', color: playlist.isPublic ? '#1db954' : '#b3b3b3' }} onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.7'; }} onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}>{playlist.isPublic ? 'Public' : 'Private'}</button></div></div>
            </div>
          ))}</div>
        )}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: '10px 12px',
  backgroundColor: '#3e3e3e',
  border: '1px solid #535353',
  borderRadius: '4px',
  color: '#fff',
  fontSize: '0.9rem',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
};
