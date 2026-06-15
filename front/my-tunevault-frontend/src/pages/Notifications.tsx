import { useState, useEffect } from 'react';
import apiService from '../services/ApiService';
import type { NotificationItem } from '../types';
import styles from './Notifications.module.css';

// Backend trả DateTime.UtcNow không có 'Z' suffix → thêm vào để parse đúng UTC
function parseUtc(dateStr: string): Date {
  if (!dateStr.endsWith('Z') && !dateStr.match(/[+\-]\d{2}:\d{2}$/)) {
    return new Date(dateStr + 'Z');
  }
  return new Date(dateStr);
}

function notifTypeLabel(type: number) {
  if (type === 1) return 'Share';
  if (type === 2) return 'Follow';
  return 'Notice';
}

function formatTime(dateStr: string) {
  return parseUtc(dateStr).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiService.getNotifications()
      .then(setNotifications)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkRead = async (id: string) => {
    try {
      await apiService.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch { /* silent */ }
  };

  const handleMarkAllRead = async () => {
    try {
      await apiService.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch { /* silent */ }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await apiService.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch { /* silent */ }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>Notifications</h1>
          {unreadCount > 0 && (
            <span className={styles.badge}>{unreadCount}</span>
          )}
        </div>
        {unreadCount > 0 && (
          <button onClick={handleMarkAllRead} className={styles.markAllBtn}>
            Mark all as read
          </button>
        )}
      </div>

      <div className={styles.list}>
        {loading ? (
          <p className={styles.empty}>Loading...</p>
        ) : notifications.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>🔔</span>
            <p className={styles.emptyText}>No notifications yet</p>
          </div>
        ) : (
          notifications.map(notif => (
            <div
              key={notif.id}
              className={`${styles.item} ${!notif.isRead ? styles.unread : ''}`}
              onClick={() => !notif.isRead && handleMarkRead(notif.id)}
            >
              <div
                className={styles.dot}
                style={{ backgroundColor: notif.isRead ? 'transparent' : '#1db954' }}
              />
              <div className={styles.content}>
                <p className={styles.message}>
                  {notif.senderUsername
                    ? <><strong>{notif.senderUsername}</strong> {notif.message}</>
                    : notif.message}
                </p>
                <p className={styles.meta}>
                  {notifTypeLabel(notif.type)} · {formatTime(notif.createdAt)}
                </p>
              </div>
              <button
                className={styles.deleteBtn}
                onClick={(e) => handleDelete(notif.id, e)}
                title="Delete"
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
