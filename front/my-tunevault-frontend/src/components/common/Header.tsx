import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useMusic } from '../../hooks/MusicContext';
import type { PlayHistoryItem, NotificationItem } from '../../types';
import apiService from '../../services/ApiService';
import { useSignalRNotifications } from '../../hooks/useSignalRNotifications';
import bellImg from '../../assets/icons/notifications.png';
import arrowLeftImg from '../../assets/icons/arrow_left.png';
import chevronRightImg from '../../assets/icons/chevron_right.png';
import UploadModal from '../UploadModal';

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
    }], 0);
    setOpen(false);
    setView('menu');
  };

  const initial = user?.username?.[0]?.toUpperCase() ?? '?';
  const groups = groupByDate(history);
  const hasAvatar = !!user?.avatarUrl;

  return (
    <>
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
    }}>
      {/* Page title area (left) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>
          Good listening, <span style={{ color: '#1db954' }}>{user?.username || 'Guest'}</span>
        </p>
      </div>

      {/* Right section: upload + bell + profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>

        {/* Upload button */}
        <button
          onClick={() => setShowUpload(true)}
          title="Upload track"
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '7px 14px',
            borderRadius: '20px',
            border: '1px solid #535353',
            backgroundColor: 'transparent',
            color: '#fff',
            fontSize: '0.8rem', fontWeight: 600,
            cursor: 'pointer',
            transition: 'border-color 0.15s, background-color 0.15s',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#fff';
            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#535353';
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/>
          </svg>
          Upload
        </button>

        {/* Notification Bell */}
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button
            onClick={handleBellOpen}
            title="Notifications"
            style={{
              width: '36px', height: '36px',
              borderRadius: '50%',
              backgroundColor: notifOpen ? '#3e3e3e' : 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background-color 0.15s',
              position: 'relative',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#3e3e3e'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = notifOpen ? '#3e3e3e' : 'transparent'; }}
          >
            <img
              src={bellImg}
              alt="Notifications"
              style={{ width: '18px', height: '18px', opacity: unreadCount > 0 ? 1 : 0.5 }}
            />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: '4px', right: '4px',
                width: '14px', height: '14px',
                borderRadius: '50%',
                backgroundColor: '#1db954',
                fontSize: '0.6rem', fontWeight: 700,
                color: '#000',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                lineHeight: 1,
              }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notification dropdown */}
          {notifOpen && (
            <div style={{
              position: 'absolute', top: '44px', right: 0,
              backgroundColor: '#282828',
              borderRadius: '6px',
              width: '300px',
              zIndex: 200,
              boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
              overflow: 'hidden',
            }}>
              {/* Header */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 14px',
                borderBottom: '1px solid #3e3e3e',
              }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#fff' }}>
                  Notifications
                </span>
                {notifications.some(n => !n.isRead) && (
                  <button
                    onClick={handleMarkAllRead}
                    style={{
                      background: 'none', border: 'none',
                      fontSize: '0.72rem', color: '#1db954',
                      cursor: 'pointer', padding: 0,
                    }}
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {/* List */}
              <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
                {loadingNotifs ? (
                  <p style={{ margin: 0, padding: '14px', fontSize: '0.8rem', color: '#b3b3b3' }}>
                    Loading...
                  </p>
                ) : notifications.length === 0 ? (
                  <p style={{ margin: 0, padding: '14px', fontSize: '0.8rem', color: '#b3b3b3' }}>
                    No notifications
                  </p>
                ) : (
                  notifications.map(notif => (
                    <div
                      key={notif.id}
                      onClick={() => !notif.isRead && handleMarkRead(notif.id)}
                      style={{
                        display: 'flex', alignItems: 'flex-start', gap: '10px',
                        padding: '10px 14px',
                        cursor: notif.isRead ? 'default' : 'pointer',
                        backgroundColor: notif.isRead ? 'transparent' : 'rgba(29,185,84,0.06)',
                        transition: 'background 0.15s',
                        borderBottom: '1px solid #1a1a1a',
                      }}
                      onMouseEnter={(e) => {
                        if (!notif.isRead) e.currentTarget.style.background = 'rgba(29,185,84,0.12)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = notif.isRead ? 'transparent' : 'rgba(29,185,84,0.06)';
                      }}
                    >
                      {/* Unread dot */}
                      <div style={{
                        width: '8px', height: '8px', borderRadius: '50%',
                        backgroundColor: notif.isRead ? 'transparent' : '#1db954',
                        marginTop: '5px', flexShrink: 0,
                      }} />
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <p style={{
                          margin: 0, fontSize: '0.75rem',
                          color: notif.isRead ? '#b3b3b3' : '#fff',
                          lineHeight: 1.4,
                        }}>
                          {notif.senderUsername
                            ? <><strong>{notif.senderUsername}</strong> {notif.message}</>
                            : notif.message
                          }
                        </p>
                        <p style={{
                          margin: '3px 0 0', fontSize: '0.68rem',
                          color: '#6b6b6b',
                        }}>
                          {notifTypeLabel(notif.type)} · {parseUtc(notif.createdAt).toLocaleString('en-US', {
                            month: 'short', day: 'numeric',
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile avatar */}
        <div style={{ position: 'relative' }} ref={menuRef}>
          <button
            onClick={handleOpen}
            title={user?.username}
            style={{
              width: '36px', height: '36px',
              borderRadius: '50%',
              backgroundColor: hasAvatar ? 'transparent' : '#1db954',
              border: 'none',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.9rem', fontWeight: 700, color: '#000',
              transition: 'transform 0.15s, background-color 0.15s',
              flexShrink: 0,
              overflow: 'hidden',
              padding: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.08)';
              if (!hasAvatar) e.currentTarget.style.backgroundColor = '#1ed760';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              if (!hasAvatar) e.currentTarget.style.backgroundColor = '#1db954';
            }}
          >
            {hasAvatar ? (
              <img
                src={user!.avatarUrl!}
                alt={user?.username}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              initial
            )}
          </button>

          {/* Dropdown */}
          {open && (
            <div style={{
              position: 'absolute', top: '44px', right: 0,
              backgroundColor: '#282828',
              borderRadius: '6px',
              minWidth: '220px',
              maxWidth: '320px',
              zIndex: 200,
              boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
              overflow: 'hidden',
            }}>

              {/* MAIN MENU */}
              {view === 'menu' && (
                <div>
                  <div style={{
                    padding: '12px 14px',
                    borderBottom: '1px solid #3e3e3e',
                  }}>
                    <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 700, color: '#fff' }}>
                      {user?.username}
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#b3b3b3' }}>
                      {user?.email}
                    </p>
                  </div>

                  <MenuItem
                    label="Profile"
                    onClick={() => { setOpen(false); navigate('/profile'); }}
                  />

                  <MenuItem
                    label="Recents"
                    hasArrow
                    onClick={handleRecents}
                  />

                  <div style={{ height: '1px', backgroundColor: '#3e3e3e', margin: '4px 0' }} />

                  <MenuItem
                    label="Log out"
                    onClick={handleLogout}
                    danger
                  />
                </div>
              )}

              {/* RECENTS PANEL */}
              {view === 'recents' && (
                <div>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '10px 14px',
                    borderBottom: '1px solid #3e3e3e',
                    cursor: 'pointer',
                  }}
                    onClick={() => setView('menu')}
                  >
                    <img src={arrowLeftImg} alt="Back" style={{ width: '14px', height: '14px', opacity: 0.7 }} />
                    <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#fff' }}>
                      Recents
                    </span>
                  </div>

                  <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
                    {loadingHistory ? (
                      <p style={{ margin: 0, padding: '14px', fontSize: '0.8rem', color: '#b3b3b3' }}>
                        Loading...
                      </p>
                    ) : groups.length === 0 ? (
                      <p style={{ margin: 0, padding: '14px', fontSize: '0.8rem', color: '#b3b3b3' }}>
                        No play history yet
                      </p>
                    ) : (
                      groups.map(group => (
                        <div key={group.label}>
                          <p style={{
                            margin: 0,
                            padding: '10px 14px 4px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            color: '#b3b3b3',
                            textTransform: 'uppercase',
                            letterSpacing: '0.06em',
                          }}>
                            {group.label}
                          </p>

                          {group.items.map(item => (
                            <div
                              key={item.id}
                              onClick={() => handlePlayFromHistory(item)}
                              style={{
                                display: 'flex', alignItems: 'center', gap: '10px',
                                padding: '6px 14px',
                                cursor: 'pointer',
                                transition: 'background 0.15s',
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = '#3e3e3e'}
                              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                              <img
                                src={item.coverPath ?? FALLBACK_COVER}
                                alt={item.title}
                                onError={(e) => { e.currentTarget.src = FALLBACK_COVER; }}
                                style={{
                                  width: '36px', height: '36px',
                                  objectFit: 'cover', borderRadius: '4px', flexShrink: 0,
                                }}
                              />
                              <div style={{ overflow: 'hidden', flex: 1 }}>
                                <p style={{
                                  margin: 0, fontSize: '0.8rem', fontWeight: 600,
                                  color: '#fff',
                                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                }}>
                                  {item.title}
                                </p>
                                <p style={{
                                  margin: '1px 0 0', fontSize: '0.72rem', color: '#b3b3b3',
                                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                }}>
                                  {item.artist}
                                </p>
                              </div>
                              <span style={{ fontSize: '0.68rem', color: '#6b6b6b', flexShrink: 0 }}>
                                {parseUtc(item.playedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                              </span>
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

function MenuItem({
  label, onClick, hasArrow = false, danger = false,
}: {
  label: string;
  onClick: () => void;
  hasArrow?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        width: '100%', padding: '10px 14px',
        background: 'none', border: 'none',
        color: danger ? '#ff6b6b' : '#fff',
        fontSize: '0.875rem', cursor: 'pointer',
        textAlign: 'left', transition: 'background 0.15s',
      }}
      onMouseEnter={(e) => e.currentTarget.style.background = '#3e3e3e'}
      onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
    >
      {label}
      {hasArrow && (
        <img src={chevronRightImg} alt="" style={{ width: '12px', height: '12px', opacity: 0.5 }} />
      )}
    </button>
  );
}
