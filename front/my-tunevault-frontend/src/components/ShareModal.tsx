import { useState, useEffect, useRef } from 'react';
import apiService from '../services/ApiService';
import styles from './ShareModal.module.css';
import type { UserSearchResult } from '../types';

interface Props {
  mediaItemId?: string;
  playlistId?: string;
  title: string;
  onClose: () => void;
}

const FALLBACK_AVATAR = (name: string) =>
  `data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="36" height="36"%3E%3Crect fill="%23535353" width="36" height="36" rx="50%25"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".35em" fill="%23fff" font-size="15" font-family="sans-serif"%3E${encodeURIComponent(name[0]?.toUpperCase() ?? '?')}%3C/text%3E%3C/svg%3E`;

export default function ShareModal({ mediaItemId, playlistId, title, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [selected, setSelected] = useState<UserSearchResult | null>(null);
  const [searching, setSearching] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 2) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await apiService.searchUsers(query);
        setResults(data);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  const handleSelect = (user: UserSearchResult) => {
    setSelected(user);
    setQuery(user.username);
    setResults([]);
    setError('');
  };

  const handleShare = async () => {
    if (!selected) return;
    setSharing(true);
    setError('');
    try {
      await apiService.shareMedia(selected.id, mediaItemId, playlistId);
      setSuccess(true);
      setTimeout(onClose, 1400);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Share failed';
      setError(msg.includes('409') || msg.toLowerCase().includes('đã được chia sẻ')
        ? 'Bạn đã chia sẻ nội dung này với người đó rồi.'
        : 'Không thể chia sẻ. Vui lòng thử lại.');
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.headerRow}>
          <div>
            <h2 className={styles.title}>Chia sẻ</h2>
            <p className={styles.subtitle}>{title}</p>
          </div>
          <button onClick={onClose} className={styles.closeBtn}>×</button>
        </div>

        {/* Search input */}
        <div className={styles.inputWrap}>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelected(null); setError(''); setSuccess(false); }}
            placeholder="Tìm tên người dùng..."
            className={styles.inputField}
          />
          {searching && <span className={styles.searchSpinner}>...</span>}
        </div>

        {/* Search results dropdown */}
        {results.length > 0 && !selected && (
          <div className={styles.results}>
            {results.map(user => (
              <div key={user.id} onClick={() => handleSelect(user)} className={styles.resultItem}>
                <img src={user.avatarUrl ?? FALLBACK_AVATAR(user.username)} alt={user.username} onError={(e) => { e.currentTarget.src = FALLBACK_AVATAR(user.username); }} className={styles.avatar} />
                <div>
                  <p className={styles.resultName}>{user.username}</p>
                  {user.bio && <p className={styles.resultBio}>{user.bio}</p>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Selected user chip */}
        {selected && (
          <div className={styles.selectedChip}>
            <img src={selected.avatarUrl ?? FALLBACK_AVATAR(selected.username)} alt={selected.username} onError={(e) => { e.currentTarget.src = FALLBACK_AVATAR(selected.username); }} className={styles.selectedAvatar} />
            <span className={styles.selectedName}>{selected.username}</span>
            <button onClick={() => { setSelected(null); setQuery(''); setError(''); }} className={styles.closeBtn}>×</button>
          </div>
        )}

        {/* Error */}
        {error && <p className={styles.errorMsg}>{error}</p>}

        {/* Success */}
        {success && <p className={styles.successMsg}>Đã chia sẻ thành công!</p>}

        {/* Actions */}
        <div className={styles.actionRow}>
          <button onClick={onClose} className={`${styles.btn} ${styles.cancel}`}>Hủy</button>
          <button onClick={handleShare} disabled={!selected || sharing || success} className={`${styles.btn} ${styles.share} ${!selected || sharing || success ? styles.disabled : ''}`}>
            {sharing ? 'Đang gửi...' : 'Chia sẻ'}
          </button>
        </div>
      </div>
    </div>
  );
}
