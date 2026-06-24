import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/ApiService';
import { useMusic } from '../hooks/MusicContext';
import type { ShareItem, Playlist, Song } from '../types';
import styles from './ShareInbox.module.css';

const FALLBACK_COVER = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="180" height="180"%3E%3Crect fill="%23282828" width="180" height="180"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23b3b3b3" font-size="40"%3E%F0%9F%8E%B5%3C/text%3E%3C/svg%3E';

// Backend trả DateTime.UtcNow không có 'Z' suffix → thêm vào để parse đúng UTC
function parseUtc(dateStr: string): Date {
  if (!dateStr.endsWith('Z') && !dateStr.match(/[+\-]\d{2}:\d{2}$/)) {
    return new Date(dateStr + 'Z');
  }
  return new Date(dateStr);
}

function formatTime(dateStr: string) {
  return parseUtc(dateStr).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

type Tab = 'received' | 'sent';

export default function ShareInbox() {
  const { songs, setQueue } = useMusic();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('received');
  const [items, setItems] = useState<ShareItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [playlistInfo, setPlaylistInfo] = useState<Record<string, Playlist | null>>({});
  const [mediaInfo, setMediaInfo] = useState<Record<string, Song | null>>({});

  const load = useCallback(async (t: Tab) => {
    setLoading(true);
    try {
      const data = t === 'received' ? await apiService.getShareInbox() : await apiService.getShareSent();
      setItems(data);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(tab); }, [tab, load]);

  // Fetch playlist info
  useEffect(() => {
    const idsToFetch = items
      .map(i => i.playlistId)
      .filter((id): id is string => !!id && !(id in playlistInfo));
    idsToFetch.forEach((id) => {
      apiService.getPlaylist(id)
        .then(pl => setPlaylistInfo(prev => ({ ...prev, [id]: pl })))
        .catch(() => setPlaylistInfo(prev => ({ ...prev, [id]: null })));
    });
  }, [items, playlistInfo]);

  // Fetch media info cho bài hát không có trong songs context
  useEffect(() => {
    items
      .filter(i => i.mediaItemId)
      .forEach(item => {
        const id = item.mediaItemId!;
        if (!songs.find(s => s.id === id) && !(id in mediaInfo)) {
          apiService.getMediaById(id)
            .then(s => setMediaInfo(prev => ({ ...prev, [id]: s })))
            .catch(() => setMediaInfo(prev => ({ ...prev, [id]: null })));
        }
      });
  }, [items, songs, mediaInfo]);

  const handleItemClick = (item: ShareItem) => {
    if (item.mediaItemId) {
      const song = songs.find(s => s.id === item.mediaItemId) ?? mediaInfo[item.mediaItemId!];
      if (song) setQueue([song], 0);
    } else if (item.playlistId) {
      if (playlistInfo[item.playlistId]) navigate(`/playlist/${item.playlistId}`);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await apiService.deleteShare(id);
      setItems(prev => prev.filter(i => i.id !== id));
    } catch { /* silent */ }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Chia sẻ</h1>
        <div className={styles.tabRow}>
          <button
            className={`${styles.tab} ${tab === 'received' ? styles.activeTab : ''}`}
            onClick={() => setTab('received')}
          >
            Đã nhận
          </button>
          <button
            className={`${styles.tab} ${tab === 'sent' ? styles.activeTab : ''}`}
            onClick={() => setTab('sent')}
          >
            Đã gửi
          </button>
        </div>
      </div>

      <div className={styles.list}>
        {loading ? (
          <p className={styles.empty}>Đang tải...</p>
        ) : items.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>{tab === 'received' ? '📥' : '📤'}</span>
            <p className={styles.emptyText}>
              {tab === 'received' ? 'Chưa có ai chia sẻ gì với bạn' : 'Bạn chưa chia sẻ gì'}
            </p>
          </div>
        ) : (
          items.map(item => {
            let title = 'Đang tải...';
            let sub = '';
            let cover = FALLBACK_COVER;
            let canInteract = false;

            if (item.mediaItemId) {
              const song = songs.find(s => s.id === item.mediaItemId) ?? mediaInfo[item.mediaItemId] ?? null;
              title = song?.title ?? (item.mediaItemId in mediaInfo ? 'Bài hát đã bị xóa' : 'Đang tải...');
              sub = song?.artist ?? '';
              cover = song?.cover || FALLBACK_COVER;
              canInteract = !!song;
            } else if (item.playlistId) {
              const pl = playlistInfo[item.playlistId];
              if (pl) {
                title = pl.title;
                sub = 'Playlist';
                cover = pl.cover || FALLBACK_COVER;
                canInteract = true;
              } else if (pl === null) {
                title = 'Playlist đã chia sẻ';
                sub = 'Không thể xem (riêng tư)';
              }
            }

            const counterpart = tab === 'received' ? item.sharedByUsername : item.sharedToUsername;

            return (
              <div
                key={item.id}
                className={styles.item}
                onClick={() => handleItemClick(item)}
                style={{ cursor: canInteract ? 'pointer' : 'default' }}
              >
                <img
                  src={cover}
                  alt={title}
                  className={styles.cover}
                  onError={(e) => { e.currentTarget.src = FALLBACK_COVER; }}
                />
                <div className={styles.content}>
                  <p className={styles.itemTitle}>{title}</p>
                  <p className={styles.itemSub}>{sub}</p>
                  <p className={styles.meta}>
                    {tab === 'received' ? 'Từ' : 'Đến'} @{counterpart || '?'} · {formatTime(item.sharedAt)}
                  </p>
                </div>
                <button className={styles.deleteBtn} onClick={(e) => handleDelete(item.id, e)} title="Xóa">
                  ✕
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
