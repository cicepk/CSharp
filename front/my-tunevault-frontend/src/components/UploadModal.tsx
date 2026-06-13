import { useState, useRef, useCallback } from 'react';
import apiService from '../services/ApiService';

interface Props {
  onClose: () => void;
  onUploaded: () => void;
}

const AUDIO_EXTS = ['.mp3', '.wav', '.flac', '.m4a'];
const VIDEO_EXTS = ['.mp4', '.webm', '.mkv'];

function getMediaType(file: File): 1 | 2 | null {
  const ext = '.' + file.name.split('.').pop()!.toLowerCase();
  if (AUDIO_EXTS.includes(ext)) return 1;
  if (VIDEO_EXTS.includes(ext)) return 2;
  return null;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UploadModal({ onClose, onUploaded }: Props) {
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<1 | 2>(1);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const mediaInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const handleMediaFile = useCallback((file: File) => {
    const detected = getMediaType(file);
    if (!detected) {
      setError(`Unsupported type. Audio: ${AUDIO_EXTS.join(', ')} | Video: ${VIDEO_EXTS.join(', ')}`);
      return;
    }
    setError('');
    setMediaFile(file);
    setMediaType(detected);
    // Auto-fill title from filename (remove extension)
    const nameNoExt = file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
    setTitle(nameNoExt);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleMediaFile(file);
  }, [handleMediaFile]);

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    const url = URL.createObjectURL(file);
    setCoverPreview(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaFile) return;
    if (!title.trim()) { setError('Track name is required'); return; }
    if (!artist.trim()) { setError('Artist is required'); return; }

    setError('');
    setUploading(true);
    setProgress(0);

    try {
      await apiService.uploadMedia(
        mediaFile,
        title.trim(),
        artist.trim(),
        mediaType,
        coverFile ?? undefined,
        setProgress,
      );
      setDone(true);
      setTimeout(() => { onUploaded(); onClose(); }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setUploading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        backgroundColor: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 400,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#242424',
          borderRadius: '12px',
          width: '520px',
          maxWidth: '95vw',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 24px 64px rgba(0,0,0,0.8)',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid #3e3e3e',
        }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>
            Upload track
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#b3b3b3', fontSize: '1.2rem', lineHeight: 1,
              padding: '2px 6px', borderRadius: '4px',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = '#3e3e3e'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#b3b3b3'; e.currentTarget.style.background = 'none'; }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>

          {/* Drop zone */}
          {!mediaFile ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => mediaInputRef.current?.click()}
              style={{
                border: `2px dashed ${dragOver ? '#1db954' : '#535353'}`,
                borderRadius: '10px',
                padding: '2.5rem 1.5rem',
                textAlign: 'center',
                cursor: 'pointer',
                backgroundColor: dragOver ? 'rgba(29,185,84,0.06)' : 'transparent',
                transition: 'all 0.15s',
                marginBottom: '1.25rem',
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = '#1db954'}
              onMouseLeave={(e) => { if (!dragOver) e.currentTarget.style.borderColor = '#535353'; }}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🎵</div>
              <p style={{ margin: '0 0 6px', fontSize: '0.95rem', fontWeight: 600, color: '#fff' }}>
                Drag & drop your file here
              </p>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#b3b3b3' }}>
                Audio: MP3, WAV, FLAC, M4A · Video: MP4, WEBM, MKV
              </p>
              <p style={{ margin: '8px 0 0', fontSize: '0.75rem', color: '#535353' }}>
                Max 500 MB · Click to browse
              </p>
            </div>
          ) : (
            /* Selected file info */
            <div style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '12px 14px',
              backgroundColor: '#2a2a2a',
              borderRadius: '8px',
              marginBottom: '1.25rem',
              border: '1px solid #3e3e3e',
            }}>
              <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>
                {mediaType === 1 ? '🎵' : '🎬'}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  margin: 0, fontSize: '0.85rem', fontWeight: 600, color: '#fff',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {mediaFile.name}
                </p>
                <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#b3b3b3' }}>
                  {mediaType === 1 ? 'Audio' : 'Video'} · {formatBytes(mediaFile.size)}
                </p>
              </div>
              {!uploading && (
                <button
                  type="button"
                  onClick={() => { setMediaFile(null); setTitle(''); setError(''); }}
                  style={{
                    background: 'none', border: 'none', color: '#b3b3b3',
                    cursor: 'pointer', fontSize: '1rem', flexShrink: 0,
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#b3b3b3'}
                >
                  ✕
                </button>
              )}
            </div>
          )}

          <input
            ref={mediaInputRef}
            type="file"
            accept=".mp3,.wav,.flac,.m4a,.mp4,.webm,.mkv"
            style={{ display: 'none' }}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleMediaFile(f); }}
          />

          {/* Metadata form — only shown after file selected */}
          {mediaFile && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>

              {/* Cover art — large, centered, drag & drop support */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <div
                  onClick={() => !uploading && coverInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); if (!uploading) e.currentTarget.style.borderColor = '#1db954'; }}
                  onDragLeave={(e) => { e.currentTarget.style.borderColor = coverPreview ? 'transparent' : '#535353'; }}
                  onDrop={(e) => {
                    e.preventDefault(); e.stopPropagation();
                    if (uploading) return;
                    const f = e.dataTransfer.files[0];
                    if (f && f.type.startsWith('image/')) {
                      setCoverFile(f);
                      setCoverPreview(URL.createObjectURL(f));
                    }
                    e.currentTarget.style.borderColor = 'transparent';
                  }}
                  style={{
                    width: '140px', height: '140px',
                    borderRadius: '10px',
                    backgroundColor: coverPreview ? 'transparent' : '#2a2a2a',
                    cursor: uploading ? 'default' : 'pointer',
                    overflow: 'hidden',
                    border: `2px dashed ${coverPreview ? 'transparent' : '#535353'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    position: 'relative',
                    transition: 'border-color 0.15s, box-shadow 0.15s',
                    boxShadow: coverPreview ? '0 4px 20px rgba(0,0,0,0.5)' : 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (!uploading) e.currentTarget.style.borderColor = '#1db954';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = coverPreview ? 'transparent' : '#535353';
                  }}
                >
                  {coverPreview ? (
                    <>
                      <img
                        src={coverPreview}
                        alt="cover preview"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      {/* Hover overlay */}
                      {!uploading && (
                        <div
                          className="cover-overlay"
                          style={{
                            position: 'absolute', inset: 0,
                            backgroundColor: 'rgba(0,0,0,0.55)',
                            display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center', gap: '6px',
                            opacity: 0, transition: 'opacity 0.18s',
                            borderRadius: '8px',
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                          onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}
                        >
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff">
                            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                          </svg>
                          <span style={{ fontSize: '0.72rem', color: '#fff', fontWeight: 600 }}>Change photo</span>
                        </div>
                      )}
                      {/* Remove button */}
                      {!uploading && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCoverFile(null);
                            setCoverPreview(null);
                          }}
                          style={{
                            position: 'absolute', top: '6px', right: '6px',
                            width: '22px', height: '22px',
                            borderRadius: '50%',
                            backgroundColor: 'rgba(0,0,0,0.7)',
                            border: 'none', cursor: 'pointer',
                            color: '#fff', fontSize: '0.7rem', lineHeight: 1,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            zIndex: 1,
                          }}
                        >
                          ✕
                        </button>
                      )}
                    </>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '0 12px' }}>
                      <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🖼️</div>
                      <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 600, color: '#b3b3b3' }}>
                        Add cover art
                      </p>
                      <p style={{ margin: '4px 0 0', fontSize: '0.68rem', color: '#535353' }}>
                        JPG, PNG, WebP
                      </p>
                    </div>
                  )}
                </div>

                <p style={{ margin: 0, fontSize: '0.72rem', color: '#535353' }}>
                  {coverPreview ? 'Drag a new image to replace' : 'Optional · Drag or click to upload'}
                </p>
              </div>

              <input
                ref={coverInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                style={{ display: 'none' }}
                onChange={handleCoverChange}
              />

              {/* Title + Artist */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input
                  type="text"
                  placeholder="Track name *"
                  value={title}
                  onChange={(e) => { setTitle(e.target.value); setError(''); }}
                  maxLength={200}
                  disabled={uploading}
                  style={fieldStyle(uploading)}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#1db954'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#535353'}
                />
                <input
                  type="text"
                  placeholder="Artist *"
                  value={artist}
                  onChange={(e) => { setArtist(e.target.value); setError(''); }}
                  maxLength={200}
                  disabled={uploading}
                  style={fieldStyle(uploading)}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#1db954'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#535353'}
                />
              </div>

              {/* Media type toggle */}
              <div style={{ display: 'flex', gap: '8px' }}>
                {([1, 2] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    disabled={uploading}
                    onClick={() => setMediaType(t)}
                    style={{
                      padding: '6px 16px',
                      borderRadius: '20px',
                      border: `1px solid ${mediaType === t ? '#1db954' : '#535353'}`,
                      backgroundColor: mediaType === t ? 'rgba(29,185,84,0.15)' : 'transparent',
                      color: mediaType === t ? '#1db954' : '#b3b3b3',
                      fontSize: '0.8rem', fontWeight: 600,
                      cursor: uploading ? 'not-allowed' : 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {t === 1 ? '🎵 Audio' : '🎬 Video'}
                  </button>
                ))}
              </div>

              {/* Error */}
              {error && (
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#e53e3e' }}>{error}</p>
              )}

              {/* Progress bar */}
              {uploading && (
                <div>
                  <div style={{
                    height: '4px', borderRadius: '2px',
                    backgroundColor: '#3e3e3e',
                    overflow: 'hidden',
                    marginBottom: '6px',
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${progress}%`,
                      backgroundColor: done ? '#1db954' : '#1db954',
                      transition: 'width 0.2s',
                      borderRadius: '2px',
                    }} />
                  </div>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#b3b3b3', textAlign: 'center' }}>
                    {done ? '✓ Upload complete!' : `Uploading... ${progress}%`}
                  </p>
                </div>
              )}

              {/* Submit */}
              {!uploading && (
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
                  <button
                    type="button"
                    onClick={onClose}
                    style={{
                      padding: '10px 20px', borderRadius: '20px',
                      border: '1px solid #535353', backgroundColor: 'transparent',
                      color: '#fff', fontSize: '0.875rem', fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: '10px 28px', borderRadius: '20px',
                      border: 'none', backgroundColor: '#1db954',
                      color: '#000', fontSize: '0.875rem', fontWeight: 700,
                      cursor: 'pointer', transition: 'background-color 0.15s, transform 0.1s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#1ed760';
                      e.currentTarget.style.transform = 'scale(1.03)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#1db954';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    Upload
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Error before file selected */}
          {!mediaFile && error && (
            <p style={{ margin: '-0.5rem 0 0', fontSize: '0.8rem', color: '#e53e3e' }}>{error}</p>
          )}
        </form>
      </div>
    </div>
  );
}

function fieldStyle(disabled: boolean): React.CSSProperties {
  return {
    padding: '10px 12px',
    backgroundColor: '#3e3e3e',
    border: '1px solid #535353',
    borderRadius: '6px',
    color: disabled ? '#b3b3b3' : '#fff',
    fontSize: '0.875rem',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
    opacity: disabled ? 0.6 : 1,
  };
}
