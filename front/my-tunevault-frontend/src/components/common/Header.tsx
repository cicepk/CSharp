import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useMusic } from '../../hooks/MusicContext';
import type { PlayHistoryItem, NotificationItem } from '../../types';
import apiService from '../../services/ApiService';
import { useSignalRNotifications } from '../../hooks/useSignalRNotifications';
import bellImg from '../../assets/icons/notifications.png';
import arrowLeftImg from '../../assets/icons/arrow_left.png';
import UploadModal from '../UploadModal';
import styles from './Header.module.css';

// Backend trả DateTime.UtcNow nhưng không có 'Z' suffix
// → thêm 'Z' để JS parse đúng UTC → convert sang local time
function parseUtc(dateStr: string): Date {
  if (!dateStr.endsWith('Z') && !dateStr.match(/[+\-]\d{2}:\d{2}$/)) {
    return new Date(dateStr + 'Z');
  }
  return new Date(dateStr);
}

function groupByDate(items: PlayHistoryItem[]): { label: string; items: PlayHistoryItem[] }[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const groups: Record<string, PlayHistoryItem[]> = {};

  for (const item of items) {
    const d = parseUtc(item.playedAt);
    d.setHours(0, 0, 0, 0);
    let label: string;
    if (d.getTime() === today.getTime()) label = 'Today';
    else if (d.getTime() === yesterday.getTime()) label = 'Yesterday';
    else label = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    if (!groups[label]) groups[label] = [];
    groups[label].push(item);
  }

  return Object.entries(groups).map(([label, items]) => ({ label, items }));
}

const FALLBACK_COVER = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="40" height="40"%3E%3Crect fill="%23282828" width="40" height="40"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23b3b3b3" font-size="18"%3E%F0%9F%8E%B5%3C/text%3E%3C/svg%3E';

function notifTypeLabel(type: number) {
  if (type === 1) return 'Share';
  if (type === 2) return 'Follow';
  return 'Notice';
}

export default function Header() {
  const { user, logout, isAuthenticated } = useAuth();
  const { setQueue } = useMusic();
  const navigate = useNavigate();

  // Profile dropdown
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<'menu' | 'recents'>('menu');
  const [history, setHistory] = useState<PlayHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Notification bell
  const [showUpload, setShowUpload] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Real-time notifications via SignalR
  useSignalRNotifications(isAuthenticated, (newNotif) => {
    setNotifications(prev => [newNotif, ...prev]);
    setUnreadCount(prev => prev + 1);
  });

  // Fetch unread count on mount
  useEffect(() => {
    apiService.getUnreadNotificationCount()
      .then(setUnreadCount)
      .catch(() => {});
  }, []);

  // Close both dropdowns when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      if (menuRef.current && !menuRef.current.contains(target)) {
        setOpen(false);
        setView('menu');
      }
      if (notifRef.current && !notifRef.current.contains(target)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Bell handlers
  const handleBellOpen = async () => {
    const opening = !notifOpen;
    setNotifOpen(opening);
    if (opening) {
      setOpen(false);
      setView('menu');
      setLoadingNotifs(true);
      try {
        const data = await apiService.getNotifications();
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.isRead).length);
      } catch {
        setNotifications([]);
      } finally {
        setLoadingNotifs(false);
      }
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await apiService.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch { /* silent */ }
  };

  const handleMarkAllRead = async () => {
    try {
      await apiService.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch { /* silent */ }
  };

  // Profile handlers
  const handleOpen = () => {
    setOpen(v => !v);
    setView('menu');
    setNotifOpen(false);
  };

  const handleRecents = async () => {
    setView('recents');
    setLoadingHistory(true);
    try {
      const data = await apiService.getPlayHistory();
      setHistory(data);
    } catch {
      setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleLogout = () => {
    logout();
    setOpen(false);
    navigate('/login');
  };

  const handlePlayFromHistory = (item: PlayHistoryItem) => {
    setQueue([{
      id: item.mediaItemId,
      title: item.title,
      artist: item.artist,
      url: item.streamUrl,
      cover: item.coverPath ?? '',
      mediaType: 1,
    }], 0);
    setOpen(false);
    setView('menu');
  };

  const initial = user?.username?.[0]?.toUpperCase() ?? '?';
  const groups = groupByDate(history);
  const hasAvatar = !!user?.avatarUrl;

  return (
    <>
      <header className={styles.header}>
        {/* Page title area (left) */}
        <div className={styles.left}>
          <p className={styles.greeting}>Good listening, <span className={styles.username}>{user?.username || 'Guest'}</span></p>
        </div>

        {/* Right section: upload + bell + profile */}
        <div className={styles.right}>

          {/* Upload button */}
          <button onClick={() => setShowUpload(true)} title="Upload track" className={styles.uploadBtn}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/></svg>
            Upload
          </button>

          {/* Notification Bell */}
          <div className={styles.notifWrap} ref={notifRef}>
            <button onClick={handleBellOpen} title="Notifications" className={`${styles.notifBtn} ${notifOpen ? styles.active : ''}`}>
              <img src={bellImg} alt="Notifications" className={styles.notifIcon} style={{ opacity: unreadCount > 0 ? 1 : 0.5 }} />
              {unreadCount > 0 && (<span className={styles.unreadBadge}>{unreadCount > 9 ? '9+' : unreadCount}</span>)}
            </button>

            {notifOpen && (
              <div className={styles.notifDropdown}>
                <div className={styles.notifHeader}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#fff' }}>Notifications</span>
                  {notifications.some(n => !n.isRead) && (<button onClick={handleMarkAllRead} style={{ background: 'none', border: 'none', fontSize: '0.72rem', color: '#1db954', cursor: 'pointer', padding: 0 }}>Mark all read</button>)}
                </div>
                <div className={styles.notifList}>
                  {loadingNotifs ? (
                    <p style={{ margin: 0, padding: '14px', fontSize: '0.8rem', color: '#b3b3b3' }}>Loading...</p>
                  ) : notifications.length === 0 ? (
                    <p style={{ margin: 0, padding: '14px', fontSize: '0.8rem', color: '#b3b3b3' }}>No notifications</p>
                  ) : (
                    notifications.map(notif => (
                      <div key={notif.id} onClick={() => !notif.isRead && handleMarkRead(notif.id)} className={`${styles.notifItem} ${!notif.isRead ? styles.unread : ''}`}>
                        <div className={styles.notifDot} style={{ backgroundColor: notif.isRead ? 'transparent' : '#1db954' }} />
                        <div style={{ flex: 1, overflow: 'hidden' }} className="notifContent">
                          <p style={{ margin: 0, fontSize: '0.75rem', color: notif.isRead ? '#b3b3b3' : '#fff', lineHeight: 1.4 }}>
                            {notif.senderUsername ? <><strong>{notif.senderUsername}</strong> {notif.message}</> : notif.message}
                          </p>
                          <p className={styles.notifMeta}>{notifTypeLabel(notif.type)} · {parseUtc(notif.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className={styles.notifFooter}>
                  <button onClick={() => { setNotifOpen(false); navigate('/notifications'); }} className={styles.viewAllBtn}>
                    View all notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Profile avatar */}
          <div className={styles.profileWrap} ref={menuRef}>
            <button onClick={handleOpen} title={user?.username} className={`${styles.profileBtn} ${hasAvatar ? styles.hasAvatar : styles.noAvatar}`}>
              {hasAvatar ? (<img src={user!.avatarUrl!} alt={user?.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />) : initial}
            </button>

            {open && (
              <div className={styles.profileDropdown}>
                {view === 'menu' && (
                  <div>
                    <div className={styles.menuSection}>
                      <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 700, color: '#fff' }}>{user?.username}</p>
                      <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#b3b3b3' }}>{user?.email}</p>
                    </div>

                    <button className={styles.menuItem} onClick={() => { setOpen(false); navigate('/profile'); }}>Profile</button>
                    <button className={styles.menuItem} onClick={handleRecents}><span>Recents</span>{/* arrow handled in MenuItem previously */}</button>

                    <div style={{ height: '1px', backgroundColor: '#3e3e3e', margin: '4px 0' }} />

                    <button className={`${styles.menuItem} ${styles.danger}`} onClick={handleLogout}>Log out</button>
                  </div>
                )}

                {view === 'recents' && (
                  <div>
                    <div className={styles.recentsHeader} onClick={() => setView('menu')}>
                      <img src={arrowLeftImg} alt="Back" style={{ width: '14px', height: '14px', opacity: 0.7 }} />
                      <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#fff' }}>Recents</span>
                    </div>

                    <div className={styles.recentsList}>
                      {loadingHistory ? (
                        <p style={{ margin: 0, padding: '14px', fontSize: '0.8rem', color: '#b3b3b3' }}>Loading...</p>
                      ) : groups.length === 0 ? (
                        <p style={{ margin: 0, padding: '14px', fontSize: '0.8rem', color: '#b3b3b3' }}>No play history yet</p>
                      ) : (
                        groups.map(group => (
                          <div key={group.label}>
                            <p className={styles.recentGroupTitle}>{group.label}</p>

                            {group.items.map(item => (
                              <div key={item.id} onClick={() => handlePlayFromHistory(item)} className={styles.recentItem}>
                                <img src={item.coverPath ?? FALLBACK_COVER} alt={item.title} onError={(e) => { e.currentTarget.src = FALLBACK_COVER; }} className={styles.recentCover} />
                                <div className={styles.recentText} style={{ overflow: 'hidden', flex: 1 }}>
                                  <p>{item.title}</p>
                                  <p className="sub" style={{ margin: '1px 0 0', fontSize: '0.72rem', color: '#b3b3b3' }}>{item.artist}</p>
                                </div>
                                <span className={styles.recentTime}>{parseUtc(item.playedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                            ))}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </header>

      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onUploaded={() => setShowUpload(false)}
        />
      )}
    </>
  );
}
