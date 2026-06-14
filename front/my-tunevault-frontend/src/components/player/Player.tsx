import { useState, useEffect, useRef } from 'react';
import { useMusic } from '../../hooks/MusicContext';
import type { Playlist } from '../../types';
import apiService from '../../services/ApiService';
import playButtonImg from '../../assets/icons/play-button.png';
import pauseImg from '../../assets/icons/pause.png';
import nextImg from '../../assets/icons/next-icon.png';
import previousImg from '../../assets/icons/previous-icon.png';
import shuffleImg from '../../assets/icons/shuffle.png';
import repeatImg from '../../assets/icons/repeat.png';
import addImg from '../../assets/icons/add.png';
import volumeImg from '../../assets/icons/volume_up.png';
import styles from './Player.module.css';

function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const FALLBACK_COVER = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="56" height="56"%3E%3Crect fill="%23282828" width="56" height="56"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23b3b3b3" font-size="24"%3E%F0%9F%8E%B5%3C/text%3E%3C/svg%3E';

export default function Player() {
  const {
    currentSong, isPlaying, togglePlayPause,
    playNext, playPrevious,
    currentTime, duration, audioRef,
    queue, queueIndex,
    isRepeat, isShuffle, toggleRepeat, toggleShuffle,
  } = useMusic();

  const [volume, setVolume] = useState(70);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [addMsg, setAddMsg] = useState('');
  const addMenuRef = useRef<HTMLDivElement>(null);
  const [isFav, setIsFav] = useState(false);
  const [favPlaylistId, setFavPlaylistId] = useState<string | null>(null);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume / 100;
  }, [volume, audioRef]);

  // sync favourite state and detect favourite playlist
  useEffect(() => {
    let mounted = true;
    if (!currentSong) {
      setIsFav(false);
      return () => { mounted = false; };
    }

    (async () => {
      try {
        const favs = await apiService.getFavourites().catch(() => [] as string[]);
        if (!mounted) return;
        setIsFav(Boolean(currentSong && favs.includes(currentSong.id)));
      } catch { /* silent */ }

      try {
        const pls = await apiService.getPlaylists().catch(() => [] as Playlist[]);
        if (!mounted) return;
        const found = pls.find(p => /favorite(s)?/i.test(p.title));
        if (found) setFavPlaylistId(found.id);
      } catch { /* silent */ }
    })();

    return () => { mounted = false; };
  }, [currentSong?.id]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) {
        setShowAddMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleOpenAddMenu = async () => {
    if (!currentSong) return;
    if (!showAddMenu) {
      const list = await apiService.getPlaylists().catch(() => []);
      setPlaylists(list);
    }
    setShowAddMenu(v => !v);
    setAddMsg('');
  };

  const handleAddToPlaylist = async (playlist: Playlist) => {
    if (!currentSong) return;
    try {
      await apiService.addTrackToPlaylist(playlist.id, currentSong.id);
      setAddMsg(`Added to "${playlist.title}"`);
      setTimeout(() => { setShowAddMenu(false); setAddMsg(''); }, 1200);
    } catch {
      setAddMsg('Already in playlist');
      setTimeout(() => setAddMsg(''), 1500);
    }
  };

  const handleToggleFavourite = async () => {
    if (!currentSong) return;
    const prev = isFav;
    setIsFav(!prev);

    // toggle central favourite flag
    let newVal = prev;
    try {
      newVal = await apiService.toggleFavourite(currentSong.id);
      setIsFav(newVal);
    } catch {
      setIsFav(prev);
      return;
    }

    // ensure favourite playlist exists and add/remove track
    try {
      let playlistId = favPlaylistId;
      if (!playlistId) {
        const pls = await apiService.getPlaylists().catch(() => [] as Playlist[]);
        const found = pls.find(p => /favorite(s)?/i.test(p.title));
        if (found) playlistId = found.id;
        else {
          const created = await apiService.createPlaylist('Favorite').catch(() => null);
          if (created) playlistId = created.id;
        }
        if (playlistId) setFavPlaylistId(playlistId);
      }

      if (!playlistId) return;
      if (newVal) {
        await apiService.addTrackToPlaylist(playlistId, currentSong.id).catch(() => {});
      } else {
        await apiService.removeTrackFromPlaylist(playlistId, currentSong.id).catch(() => {});
      }
    } catch { /* silent */ }
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    audioRef.current.currentTime = ((e.clientX - rect.left) / rect.width) * duration;
  };

  const hasNext = queue.length > 0 && (isShuffle || queueIndex < queue.length - 1);
  const hasPrev = queue.length > 0 && queueIndex > 0;

  return (
    <div className={styles.playerContainer}>

      {/* LEFT — Track info + add button */}
      <div className={styles.left}>
        <img
          src={currentSong?.cover || FALLBACK_COVER}
          alt={currentSong?.title || ''}
          onError={(e) => { e.currentTarget.src = FALLBACK_COVER; }}
          className={styles.trackImage}
        />
        <div className={styles.trackInfo}>
          <p
            className={styles.title}
            style={{ color: currentSong ? '#fff' : '#6b6b6b' }}
          >
            {currentSong?.title || 'No track selected'}
          </p>
          <p className={styles.artist}>{currentSong?.artist || ''}</p>
        </div>

        {/* + Add to playlist button */}
        {currentSong && (
          <div className={styles.addButtonWrapper} ref={addMenuRef}>
            <button
              onClick={handleOpenAddMenu}
              title="Add to playlist"
              className={styles.iconButton}
            >
              <img src={addImg} alt="Add to playlist" className={styles.smallIcon} />
            </button>

            {showAddMenu && (
              <div className={styles.addMenu}>
                <p className={styles.addMenuHeader}>Add to playlist</p>
                {addMsg ? (
                  <p style={{ margin: 0, padding: '8px 14px 10px', fontSize: '0.8rem', color: '#1db954' }}>
                    {addMsg}
                  </p>
                ) : playlists.length === 0 ? (
                  <p style={{ margin: 0, padding: '8px 14px 10px', fontSize: '0.8rem', color: '#b3b3b3' }}>
                    No playlists found
                  </p>
                ) : (
                  playlists.map(pl => (
                    <button
                      key={pl.id}
                      onClick={() => handleAddToPlaylist(pl)}
                      className={styles.addMenuItem}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#3e3e3e')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                    >
                      {pl.title}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* CENTER — Controls + progress */}
      <div className={styles.center}>
        <div className={styles.controlsRow}>

          {/* Shuffle */}
          <button
            onClick={toggleShuffle}
            title="Shuffle"
            className={styles.iconControl}
            style={{ opacity: isShuffle ? 1 : 0.5 }}
          >
            <img src={shuffleImg} alt="Shuffle" style={{ width: '16px', height: '16px' }} />
            {isShuffle && (
              <span style={{
                position: 'absolute', bottom: '-4px', left: '50%',
                transform: 'translateX(-50%)',
                width: '4px', height: '4px', borderRadius: '50%',
                backgroundColor: '#1db954',
              }} />
            )}
          </button>

          {/* Previous */}
          <button
            onClick={playPrevious}
            disabled={!hasPrev}
            title="Previous"
            className={styles.prevNext}
            style={{ opacity: hasPrev ? 0.7 : 0.3, cursor: hasPrev ? 'pointer' : 'default' }}
          >
            <img src={previousImg} alt="Previous" style={{ width: '18px', height: '18px', objectFit: 'contain' }} />
          </button>

          {/* Play/Pause */}
          <button
            onClick={togglePlayPause}
            title={isPlaying ? 'Pause' : 'Play'}
            className={styles.playButton}
            style={{ transform: undefined }}
          >
            <img
              src={isPlaying ? pauseImg : playButtonImg}
              alt={isPlaying ? 'Pause' : 'Play'}
              style={{ width: '16px', height: '16px', objectFit: 'contain' }}
            />
          </button>

          {/* Next */}
          <button
            onClick={playNext}
            disabled={!hasNext}
            title="Next"
            className={styles.prevNext}
            style={{ opacity: hasNext ? 0.7 : 0.3, cursor: hasNext ? 'pointer' : 'default' }}
          >
            <img src={nextImg} alt="Next" style={{ width: '18px', height: '18px', objectFit: 'contain' }} />
          </button>

          {/* Repeat */}
          <button
            onClick={toggleRepeat}
            title="Repeat"
            className={styles.iconControl}
            style={{ opacity: isRepeat ? 1 : 0.5 }}
          >
            <img src={repeatImg} alt="Repeat" style={{ width: '16px', height: '16px' }} />
            {isRepeat && (
              <span style={{
                position: 'absolute', bottom: '-4px', left: '50%',
                transform: 'translateX(-50%)',
                width: '4px', height: '4px', borderRadius: '50%',
                backgroundColor: '#1db954',
              }} />
            )}
          </button>

          {/* Favorite */}
          <button
            onClick={handleToggleFavourite}
            title={isFav ? 'Unfavorite' : 'Favorite'}
            className={styles.iconControl}
            style={{ color: isFav ? '#e0245e' : undefined, marginLeft: '6px' }}
          >
            {isFav ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#e0245e" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 21s-7.333-4.534-9.333-7.192C.667 11.587 2.04 6.5 6.2 5.02 8.01 4.346 9.91 5.04 12 7.02c2.09-1.98 3.99-2.674 5.8-1.999C21.96 6.5 23.333 11.587 21.333 13.808 19.333 16.466 12 21 12 21z" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg" color="#b3b3b3">
                <path d="M20.8 13.8C18.8 16.5 12 21 12 21s-6.8-4.5-8.8-7.2C1.2 11.6 2.6 6.5 6.8 5.1 8.6 4.5 10.5 5.2 12 7c1.5-1.8 3.4-2.5 5.2-1.9 4.2 1.4 5.6 6.5 3.6 8.7z" />
              </svg>
            )}
          </button>
        </div>
        {/* Progress bar + time */}
        <div className={styles.progressWrapper}>
          <span className={styles.time}>{formatTime(currentTime)}</span>
          <div onClick={handleProgressClick} className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${progressPercent}%` }} />
          </div>
          <span className={styles.time}>{formatTime(duration)}</span>
        </div>
      </div>

      {/* RIGHT — Volume */}
      <div className={styles.right}>
        <img src={volumeImg} alt="Volume" className={styles.iconImg} />
        <div
          className={styles.volumeContainer}
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            setVolume(Math.round(ratio * 100));
          }}
        >
          <div className={styles.volumeFill} style={{ width: `${volume}%` }} />
        </div>
      </div>
    </div>
  );
}
  