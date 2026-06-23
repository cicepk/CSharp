import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useMusic } from '../hooks/MusicContext';
import apiService from '../services/ApiService';
import styles from './Profile.module.css';
import type { Playlist, MediaItem } from '../types';

const FALLBACK_COVER = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="160" height="160"%3E%3Crect fill="%23282828" width="160" height="160"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23535353" font-size="48"%3E%F0%9F%8E%B5%3C/text%3E%3C/svg%3E';

export default function Profile() {
  const { user, refreshUser, setUser } = useAuth();
  const { removeSongById } = useMusic();
  const navigate = useNavigate();

  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loadingPlaylists, setLoadingPlaylists] = useState(true);

  const [myUploads, setMyUploads] = useState<MediaItem[]>([]);
  const [loadingUploads, setLoadingUploads] = useState(true);

  // Edit mode
  const [editing, setEditing] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editError, setEditError] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  // Change password
  const [pwCurrent, setPwCurrent] = useState('');
  const [pwNew, setPwNew] = useState('');
  const [pwConfirm, setPwConfirm] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  // Avatar upload
  const [avatarLoading, setAvatarLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    apiService.getPlaylists()
      .then(setPlaylists)
      .catch(() => {})
      .finally(() => setLoadingPlaylists(false));

    apiService.getMyUploads()
      .then(setMyUploads)
      .catch(() => {})
      .finally(() => setLoadingUploads(false));
  }, []);

  const openEdit = () => {
    setEditUsername(user?.username ?? '');
    setEditEmail(user?.email ?? '');
    setEditBio(user?.bio ?? '');
    setEditError('');
    setPwCurrent('');
    setPwNew('');
    setPwConfirm('');
    setPwError('');
    setPwSuccess('');
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

  const validatePassword = (pw: string): string => {
    if (pw.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(pw)) return 'Password must contain at least 1 uppercase letter';
    if (!/[0-9]/.test(pw)) return 'Password must contain at least 1 digit';
    return '';
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');
    if (!pwCurrent) { setPwError('Please enter your current password'); return; }
    const validationErr = validatePassword(pwNew);
    if (validationErr) { setPwError(validationErr); return; }
    if (pwNew !== pwConfirm) { setPwError('New passwords do not match'); return; }
    if (pwNew === pwCurrent) { setPwError('New password must be different from current password'); return; }
    setPwLoading(true);
    try {
      await apiService.changePassword(pwCurrent, pwNew);
      setPwSuccess('Password changed successfully!');
      setPwCurrent('');
      setPwNew('');
      setPwConfirm('');
    } catch (err) {
      setPwError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setPwLoading(false);
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

  const handleDeleteMedia = async (media: MediaItem) => {
    if (!window.confirm(`Xóa "${media.title}"? Hành động này không thể hoàn tác.`)) return;
    try {
      await apiService.deleteMedia(media.id);
      setMyUploads(prev => prev.filter(m => m.id !== media.id));
      removeSongById(media.id);
    } catch (err) {
      alert(`Xóa thất bại: ${err instanceof Error ? err.message : 'Lỗi không xác định'}`);
    }
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
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

            <div style={{ borderTop: '1px solid #333', marginTop: '1.5rem', paddingTop: '1.5rem' }}>
              <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 700, color: '#fff' }}>Change Password</h3>
              <form onSubmit={handleChangePassword}>
                <div className={styles.formCol}>
                  <label className={styles.formLabel}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#b3b3b3' }}>Current Password</span>
                    <input type="password" value={pwCurrent} onChange={(e) => { setPwCurrent(e.target.value); setPwError(''); setPwSuccess(''); }} className={styles.formInput} onFocus={(e) => (e.currentTarget as HTMLElement).style.border = '1px solid #1db954'} onBlur={(e) => (e.currentTarget as HTMLElement).style.border = '1px solid #535353'} />
                  </label>
                  <label className={styles.formLabel}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#b3b3b3' }}>New Password</span>
                    <input type="password" value={pwNew} onChange={(e) => { setPwNew(e.target.value); setPwError(''); setPwSuccess(''); }} className={styles.formInput} onFocus={(e) => (e.currentTarget as HTMLElement).style.border = '1px solid #1db954'} onBlur={(e) => (e.currentTarget as HTMLElement).style.border = '1px solid #535353'} />
                  </label>
                  <label className={styles.formLabel}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#b3b3b3' }}>Confirm New Password</span>
                    <input type="password" value={pwConfirm} onChange={(e) => { setPwConfirm(e.target.value); setPwError(''); setPwSuccess(''); }} className={styles.formInput} onFocus={(e) => (e.currentTarget as HTMLElement).style.border = '1px solid #1db954'} onBlur={(e) => (e.currentTarget as HTMLElement).style.border = '1px solid #535353'} />
                  </label>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: '#535353' }}>
                    Min 8 characters · At least 1 uppercase letter · At least 1 digit
                  </p>
                </div>
                {pwError && (<p style={{ margin: '0.75rem 0 0', fontSize: '0.8rem', color: '#e53e3e' }}>{pwError}</p>)}
                {pwSuccess && (<p style={{ margin: '0.75rem 0 0', fontSize: '0.8rem', color: '#1db954' }}>{pwSuccess}</p>)}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                  <button type="submit" disabled={pwLoading} className={styles.btn} style={{ padding: '10px 24px', border: 'none', backgroundColor: '#1db954', color: '#000', fontWeight: 700, opacity: pwLoading ? 0.7 : 1 }} onMouseEnter={(e) => { if (!pwLoading) (e.currentTarget as HTMLElement).style.backgroundColor = '#1ed760'; }} onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#1db954'; }}>{pwLoading ? 'Updating...' : 'Change Password'}</button>
                </div>
              </form>
            </div>
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

      <div className={styles.playlistsSection}>
        <h2 className={styles.playlistTitle}>Bài hát đã tải lên</h2>
        {loadingUploads ? (
          <p style={{ color: '#b3b3b3' }}>Loading...</p>
        ) : myUploads.length === 0 ? (
          <p style={{ color: '#b3b3b3' }}>Chưa có bài hát nào được tải lên.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {myUploads.map((media, idx) => (
              <div
                key={media.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '32px 40px 1fr 1fr 80px 60px 40px',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  color: '#b3b3b3',
                  fontSize: '0.875rem',
                  backgroundColor: 'transparent',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#2a2a2a')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <span style={{ color: '#b3b3b3', textAlign: 'right', fontSize: '0.8rem' }}>{idx + 1}</span>
                <img
                  src={media.coverPath || FALLBACK_COVER}
                  alt={media.title}
                  style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 2 }}
                  onError={(e) => { e.currentTarget.src = FALLBACK_COVER; }}
                />
                <span style={{ color: '#fff', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{media.title}</span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{media.artist}</span>
                <span style={{
                  padding: '2px 8px',
                  borderRadius: '999px',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  backgroundColor: media.mediaType === 1 ? 'rgba(29,185,84,0.15)' : 'rgba(99,102,241,0.15)',
                  color: media.mediaType === 1 ? '#1db954' : '#818cf8',
                  textAlign: 'center',
                }}>
                  {media.mediaType === 1 ? 'Audio' : 'Video'}
                </span>
                <span style={{ textAlign: 'right' }}>{formatDuration(media.durationSeconds)}</span>
                <button
                  onClick={() => handleDeleteMedia(media)}
                  title="Xóa bài hát"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px',
                    borderRadius: '4px',
                    color: '#b3b3b3',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'color 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#e53e3e')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#b3b3b3')}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 3v1H4v2h1v13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V6h1V4h-5V3H9zm0 5h2v9H9V8zm4 0h2v9h-2V8z"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
