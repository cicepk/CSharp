import { useState, useRef, useCallback } from 'react';
import apiService from '../services/ApiService';
import styles from './UploadModal.module.css';

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
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.title}>Upload track</h2>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>

          {/* Drop zone */}
          {!mediaFile ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => mediaInputRef.current?.click()}
              className={`${styles.dropzone} ${dragOver ? styles.dragOver : ''}`}
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
            <div className={styles.fileInfo}>
              <span className={styles.fileIcon}>{mediaType === 1 ? '🎵' : '🎬'}</span>
              <div className={styles.fileMeta}>
                <p className={styles.fileName}>{mediaFile.name}</p>
                <p className={styles.fileSub}>{mediaType === 1 ? 'Audio' : 'Video'} · {formatBytes(mediaFile.size)}</p>
              </div>
              {!uploading && (
                <button
                  type="button"
                  onClick={() => { setMediaFile(null); setTitle(''); setError(''); }}
                  className={styles.removeBtn}
                >✕</button>
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
              <div className={styles.coverArea}>
                <div
                  onClick={() => !uploading && coverInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); if (!uploading) setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault(); e.stopPropagation();
                    if (uploading) return;
                    const f = e.dataTransfer.files[0];
                    if (f && f.type.startsWith('image/')) {
                      setCoverFile(f);
                      setCoverPreview(URL.createObjectURL(f));
                    }
                    setDragOver(false);
                  }}
                  className={`${styles.coverBox} ${coverPreview ? 'hasPreview' : ''} ${dragOver ? styles.dragOver : ''}`}
                >
                  {coverPreview ? (
                    <>
                      <img src={coverPreview} alt="cover preview" className={styles.coverImg} />
                      {!uploading && (
                        <div className={styles.coverOverlay}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff">
                            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                          </svg>
                          <span style={{ fontSize: '0.72rem', color: '#fff', fontWeight: 600 }}>Change photo</span>
                        </div>
                      )}
                      {!uploading && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setCoverFile(null); setCoverPreview(null); }}
                          className={styles.coverRemove}
                        >✕</button>
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

              <input ref={coverInputRef} type="file" accept=".jpg,.jpeg,.png,.webp" style={{ display: 'none' }} onChange={handleCoverChange} />

              {/* Title + Artist */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input
                  type="text"
                  placeholder="Track name *"
                  value={title}
                  onChange={(e) => { setTitle(e.target.value); setError(''); }}
                  maxLength={200}
                  disabled={uploading}
                  className={`${styles.inputField} ${uploading ? styles.disabled : ''}`}
                />
                <input
                  type="text"
                  placeholder="Artist *"
                  value={artist}
                  onChange={(e) => { setArtist(e.target.value); setError(''); }}
                  maxLength={200}
                  disabled={uploading}
                  className={`${styles.inputField} ${uploading ? styles.disabled : ''}`}
                />
              </div>

              {/* Media type toggle */}
              <div className={styles.mediaTypeGroup}>
                {([1, 2] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    disabled={uploading}
                    onClick={() => setMediaType(t)}
                    className={`${styles.mediaTypeBtn} ${mediaType === t ? styles.active : ''}`}
                  >
                    {t === 1 ? '🎵 Audio' : '🎬 Video'}
                  </button>
                ))}
              </div>

              {/* Error */}
              {error && <p className={styles.errorMsg}>{error}</p>}

              {/* Progress bar */}
              {uploading && (
                <div>
                  <div className={styles.progressTrack}>
                    <div className={styles.progressFill} style={{ width: `${progress}%` }} />
                  </div>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#b3b3b3', textAlign: 'center' }}>
                    {done ? '✓ Upload complete!' : `Uploading... ${progress}%`}
                  </p>
                </div>
              )}

              {/* Submit */}
              {!uploading && (
                <div className={styles.buttonsRow}>
                  <button type="button" onClick={onClose} className={`${styles.btn} ${styles.cancel}`}>Cancel</button>
                  <button type="submit" className={`${styles.btn} ${styles.submit}`}>Upload</button>
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
