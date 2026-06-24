import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/ApiService';
import styles from './AdminPanel.module.css';
import type { AdminUser, AdminStats, AdminTrack } from '../types';

export default function AdminPanel() {
  const navigate = useNavigate();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Accordion: userId → tracks (null = chưa load, [] = đã load rỗng)
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [tracksMap, setTracksMap] = useState<Record<string, AdminTrack[] | 'loading'>>({});

  useEffect(() => {
    Promise.all([apiService.getAdminStats(), apiService.getAdminUsers()])
      .then(([s, u]) => { setStats(s); setUsers(u); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleToggleUser = async (userId: string) => {
    if (expandedUser === userId) {
      setExpandedUser(null);
      return;
    }
    setExpandedUser(userId);
    if (tracksMap[userId] !== undefined) return;

    setTracksMap(prev => ({ ...prev, [userId]: 'loading' }));
    try {
      const tracks = await apiService.getAdminUserTracks(userId);
      setTracksMap(prev => ({ ...prev, [userId]: tracks }));
    } catch {
      setTracksMap(prev => ({ ...prev, [userId]: [] }));
    }
  };

  const handleDeleteTrack = async (trackId: string, userId: string) => {
    if (!window.confirm('Xoá bài này? Hành động không thể hoàn tác.')) return;
    try {
      await apiService.adminDeleteTrack(trackId);
      setTracksMap(prev => {
        const list = prev[userId];
        if (!list || list === 'loading') return prev;
        return { ...prev, [userId]: list.filter(t => t.id !== trackId) };
      });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, uploadCount: u.uploadCount - 1 } : u));
      if (stats) setStats({ ...stats, totalTracks: stats.totalTracks - 1 });
    } catch (err) {
      alert(`Xoá thất bại: ${err instanceof Error ? err.message : 'Lỗi không xác định'}`);
    }
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!window.confirm(`Xoá user "${username}" và toàn bộ bài upload của họ? Hành động không thể hoàn tác.`)) return;
    try {
      const user = users.find(u => u.id === userId);
      await apiService.adminDeleteUser(userId);
      setUsers(prev => prev.filter(u => u.id !== userId));
      if (expandedUser === userId) setExpandedUser(null);
      if (stats && user) setStats({ ...stats, totalUsers: stats.totalUsers - 1, totalTracks: stats.totalTracks - user.uploadCount });
    } catch (err) {
      alert(`Xoá thất bại: ${err instanceof Error ? err.message : 'Lỗi không xác định'}`);
    }
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const initial = (name: string) => name[0]?.toUpperCase() ?? '?';

  if (loading) {
    return (
      <div className={styles.container}>
        <p style={{ color: '#b3b3b3' }}>Loading...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate('/profile')} title="Back to profile">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
          </svg>
        </button>
        <div className={styles.headerText}>
          <h1>Admin panel</h1>
          <p>Quản lý users và nội dung</p>
        </div>
      </div>

      {stats && (
        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <div className={styles.statNum}>{stats.totalUsers}</div>
            <div className={styles.statLabel}>Tổng số users</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statNum}>{stats.totalTracks}</div>
            <div className={styles.statLabel}>Tổng số bài upload</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statNum}>{users.filter(u => u.role === 'User').length}</div>
            <div className={styles.statLabel}>Users thường</div>
          </div>
        </div>
      )}

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Danh sách users</h2>
        <div className={styles.tableHeader}>
          <span>#</span>
          <span>User</span>
          <span>Role</span>
          <span style={{ textAlign: 'right' }}>Upload</span>
          <span style={{ textAlign: 'center' }}>Hành động</span>
        </div>

        {users.map((u, idx) => (
          <div key={u.id}>
            <div
              className={styles.userRow}
              onClick={() => u.role !== 'Admin' && handleToggleUser(u.id)}
              style={{ cursor: u.role === 'Admin' ? 'default' : 'pointer' }}
            >
              <span style={{ color: '#b3b3b3', fontSize: '0.8rem' }}>{idx + 1}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                <div className={styles.avatar}>{initial(u.username)}</div>
                <div className={styles.userInfo}>
                  <div className={styles.username}>
                    {u.username}
                    {u.role !== 'Admin' && expandedUser === u.id && (
                      <span style={{ color: '#b3b3b3', fontSize: '0.7rem', marginLeft: '6px' }}>▲</span>
                    )}
                    {u.role !== 'Admin' && expandedUser !== u.id && (
                      <span style={{ color: '#b3b3b3', fontSize: '0.7rem', marginLeft: '6px' }}>▼</span>
                    )}
                  </div>
                  <div className={styles.email}>{u.email}</div>
                </div>
              </div>
              <span>
                {u.role === 'Admin'
                  ? <span className={styles.badgeAdmin}>Admin</span>
                  : <span className={styles.badgeUser}>User</span>
                }
              </span>
              <span className={styles.count}>{u.uploadCount} bài</span>
              <span style={{ textAlign: 'center' }}>
                {u.role !== 'Admin' && (
                  <button
                    className={styles.delBtn}
                    onClick={(e) => { e.stopPropagation(); handleDeleteUser(u.id, u.username); }}
                  >
                    Xoá user
                  </button>
                )}
              </span>
            </div>

            {expandedUser === u.id && (
              <div className={styles.tracksPanel}>
                {tracksMap[u.id] === 'loading' ? (
                  <p className={styles.loadingTracks}>Đang tải...</p>
                ) : (tracksMap[u.id] as AdminTrack[])?.length === 0 ? (
                  <p className={styles.emptyTracks}>Chưa có bài upload nào.</p>
                ) : (
                  <>
                    <p className={styles.tracksHeader}>Bài upload của {u.username}</p>
                    {(tracksMap[u.id] as AdminTrack[]).map(track => (
                      <div key={track.id} className={styles.trackRow}>
                        <span className={styles.trackTitle}>{track.title}</span>
                        <span className={styles.trackMeta}>
                          {track.mediaType === 1 ? 'Audio' : 'Video'} · {formatDuration(track.durationSeconds)}
                        </span>
                        <button
                          className={styles.delBtn}
                          style={{ padding: '2px 10px', fontSize: '0.7rem' }}
                          onClick={() => handleDeleteTrack(track.id, u.id)}
                        >
                          Xoá
                        </button>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <p style={{ fontSize: '0.75rem', color: '#535353' }}>
        Click vào tên user để xem và xoá từng bài. Xoá user sẽ xoá toàn bộ dữ liệu của họ.
      </p>
    </div>
  );
}
