import { useState, useEffect, useRef } from 'react';
import apiService from '../services/ApiService';
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
    <div
      style={{
        position: 'fixed', inset: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        backgroundColor: '#282828',
        borderRadius: '10px',
        width: '420px',
        maxWidth: '95vw',
        padding: '24px',
        boxShadow: '0 16px 48px rgba(0,0,0,0.8)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#fff' }}>
              Chia sẻ
            </h2>
            <p style={{ margin: '3px 0 0', fontSize: '0.78rem', color: '#b3b3b3', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '300px' }}>
              {title}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#b3b3b3', fontSize: '1.3rem', cursor: 'pointer', padding: '4px', lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        {/* Search input */}
        <div style={{ position: 'relative', marginBottom: '8px' }}>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelected(null);
              setError('');
              setSuccess(false);
            }}
            placeholder="Tìm tên người dùng..."
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '6px',
              border: '1px solid #535353',
              backgroundColor: '#3e3e3e',
              color: '#fff',
              fontSize: '0.875rem',
              outline: 'none',
              boxSizing: 'border-box',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = '#1db954'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = '#535353'; }}
          />
          {searching && (
            <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.75rem', color: '#b3b3b3' }}>
              ...
            </span>
          )}
        </div>

        {/* Search results dropdown */}
        {results.length > 0 && !selected && (
          <div style={{
            backgroundColor: '#3e3e3e',
            borderRadius: '6px',
            maxHeight: '200px',
            overflowY: 'auto',
            marginBottom: '12px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          }}>
            {results.map(user => (
              <div
                key={user.id}
                onClick={() => handleSelect(user)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '10px 14px',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#535353'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <img
                  src={user.avatarUrl ?? FALLBACK_AVATAR(user.username)}
                  alt={user.username}
                  onError={(e) => { e.currentTarget.src = FALLBACK_AVATAR(user.username); }}
                  style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                />
                <div>
                  <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: '#fff' }}>{user.username}</p>
                  {user.bio && (
                    <p style={{ margin: '1px 0 0', fontSize: '0.72rem', color: '#b3b3b3', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '260px' }}>
                      {user.bio}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Selected user chip */}
        {selected && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '10px 12px',
            backgroundColor: 'rgba(29,185,84,0.12)',
            border: '1px solid rgba(29,185,84,0.3)',
            borderRadius: '6px',
            marginBottom: '14px',
          }}>
            <img
              src={selected.avatarUrl ?? FALLBACK_AVATAR(selected.username)}
              alt={selected.username}
              onError={(e) => { e.currentTarget.src = FALLBACK_AVATAR(selected.username); }}
              style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
            />
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1db954', flex: 1 }}>
              {selected.username}
            </span>
            <button
              onClick={() => { setSelected(null); setQuery(''); setError(''); }}
              style={{ background: 'none', border: 'none', color: '#b3b3b3', cursor: 'pointer', fontSize: '1rem', padding: 0, lineHeight: 1 }}
            >
              ×
            </button>
          </div>
        )}

        {/* Error */}
        {error && (
          <p style={{ margin: '0 0 12px', fontSize: '0.78rem', color: '#ff6b6b' }}>{error}</p>
        )}

        {/* Success */}
        {success && (
          <p style={{ margin: '0 0 12px', fontSize: '0.875rem', color: '#1db954', fontWeight: 600, textAlign: 'center' }}>
            Đã chia sẻ thành công!
          </p>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '9px 20px',
              borderRadius: '20px',
              border: '1px solid #535353',
              background: 'transparent',
              color: '#fff',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Hủy
          </button>
          <button
            onClick={handleShare}
            disabled={!selected || sharing || success}
            style={{
              padding: '9px 24px',
              borderRadius: '20px',
              border: 'none',
              background: !selected || sharing || success ? '#535353' : '#1db954',
              color: !selected || sharing || success ? '#b3b3b3' : '#000',
              fontSize: '0.875rem',
              fontWeight: 700,
              cursor: !selected || sharing || success ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s',
            }}
          >
            {sharing ? 'Đang gửi...' : 'Chia sẻ'}
          </button>
        </div>
      </div>
    </div>
  );
}
