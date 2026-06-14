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

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume / 100;
  }, [volume, audioRef]);

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

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    audioRef.current.currentTime = ((e.clientX - rect.left) / rect.width) * duration;
  };

  const hasNext = queue.length > 0 && (isShuffle || queueIndex < queue.length - 1);
  const hasPrev = queue.length > 0 && queueIndex > 0;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '280px 1fr 280px',
      alignItems: 'center',
      height: '100%',
      padding: '0 1rem',
      backgroundColor: '#181818',
      borderTop: '1px solid #282828',
    }}>

      {/* LEFT — Track info + add button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
        <img
          src={currentSong?.cover || FALLBACK_COVER}
          alt={currentSong?.title || ''}
          onError={(e) => { e.currentTarget.src = FALLBACK_COVER; }}
          style={{ width: '56px', height: '56px', objectFit: 'cover', borderRadius: '4px', flexShrink: 0 }}
        />
        <div style={{ overflow: 'hidden', flex: 1, minWidth: 0 }}>
          <p style={{
            margin: 0, fontSize: '0.875rem', fontWeight: 600,
            color: currentSong ? '#fff' : '#6b6b6b',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {currentSong?.title || 'No track selected'}
          </p>
          <p style={{
            margin: '2px 0 0 0', fontSize: '0.75rem', color: '#b3b3b3',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {currentSong?.artist || ''}
          </p>
        </div>

        {/* + Add to playlist button */}
        {currentSong && (
          <div style={{ position: 'relative', flexShrink: 0 }} ref={addMenuRef}>
            <button
              onClick={handleOpenAddMenu}
              title="Add to playlist"
              style={{
                background: 'none', border: '1px solid #535353',
                borderRadius: '50%', width: '24px', height: '24px',
                cursor: 'pointer', display: 'flex', alignItems: 'center',
                justifyContent: 'center', padding: 0,
                transition: 'border-color 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = '#fff'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = '#535353'}
            >
              <img src={addImg} alt="Add to playlist" style={{ width: '14px', height: '14px', opacity: 0.7 }} />
            </button>

            {showAddMenu && (
              <div style={{
                position: 'absolute', bottom: '34px', left: '0',
                backgroundColor: '#282828', borderRadius: '6px',
                minWidth: '180px', zIndex: 100,
                boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                overflow: 'hidden',
              }}>
                <p style={{
                  margin: 0, padding: '10px 14px 6px',
                  fontSize: '0.7rem', color: '#b3b3b3', textTransform: 'uppercase',
                  letterSpacing: '0.08em', fontWeight: 700,
                }}>
                  Add to playlist
                </p>
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
                      style={{
                        display: 'block', width: '100%', textAlign: 'left',
                        padding: '8px 14px', background: 'none', border: 'none',
                        color: '#fff', fontSize: '0.875rem', cursor: 'pointer',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#3e3e3e'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
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
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>

          {/* Shuffle */}
          <button
            onClick={toggleShuffle}
            title="Shuffle"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '4px', display: 'flex', alignItems: 'center',
              opacity: isShuffle ? 1 : 0.5, transition: 'opacity 0.2s',
              position: 'relative',
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = isShuffle ? '1' : '0.5'}
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
            style={{
              background: 'none', border: 'none', cursor: hasPrev ? 'pointer' : 'default',
              padding: 0, display: 'flex', alignItems: 'center',
              opacity: hasPrev ? 0.7 : 0.3, transition: 'opacity 0.2s',
            }}
            onMouseEnter={(e) => { if (hasPrev) e.currentTarget.style.opacity = '1'; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = hasPrev ? '0.7' : '0.3'; }}
          >
            <img src={previousImg} alt="Previous" style={{ width: '18px', height: '18px', objectFit: 'contain' }} />
          </button>

          {/* Play/Pause */}
          <button
            onClick={togglePlayPause}
            title={isPlaying ? 'Pause' : 'Play'}
            style={{
              backgroundColor: '#fff',
              border: 'none', borderRadius: '50%', cursor: 'pointer',
              width: '34px', height: '34px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 0, transition: 'transform 0.1s',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.06)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
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
            style={{
              background: 'none', border: 'none', cursor: hasNext ? 'pointer' : 'default',
              padding: 0, display: 'flex', alignItems: 'center',
              opacity: hasNext ? 0.7 : 0.3, transition: 'opacity 0.2s',
            }}
            onMouseEnter={(e) => { if (hasNext) e.currentTarget.style.opacity = '1'; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = hasNext ? '0.7' : '0.3'; }}
          >
            <img src={nextImg} alt="Next" style={{ width: '18px', height: '18px', objectFit: 'contain' }} />
          </button>

          {/* Repeat */}
          <button
            onClick={toggleRepeat}
            title="Repeat"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '4px', display: 'flex', alignItems: 'center',
              opacity: isRepeat ? 1 : 0.5, transition: 'opacity 0.2s',
              position: 'relative',
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = isRepeat ? '1' : '0.5'}
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
        </div>

        {/* Progress bar + time */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', maxWidth: '480px' }}>
          <span style={{ fontSize: '0.68rem', color: '#b3b3b3', minWidth: '36px', textAlign: 'right' }}>
            {formatTime(currentTime)}
          </span>
          <div
            onClick={handleProgressClick}
            style={{
              flex: 1, height: '4px', backgroundColor: '#535353',
              borderRadius: '2px', cursor: 'pointer', position: 'relative',
            }}
            onMouseEnter={(e) => { (e.currentTarget.querySelector('.progress-fill') as HTMLElement).style.backgroundColor = '#1db954'; }}
            onMouseLeave={(e) => { (e.currentTarget.querySelector('.progress-fill') as HTMLElement).style.backgroundColor = '#b3b3b3'; }}
          >
            <div
              className="progress-fill"
              style={{
                height: '100%', width: `${progressPercent}%`,
                backgroundColor: '#b3b3b3', borderRadius: '2px',
                pointerEvents: 'none', transition: 'background-color 0.2s',
              }}
            />
          </div>
          <span style={{ fontSize: '0.68rem', color: '#b3b3b3', minWidth: '36px' }}>
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* RIGHT — Volume */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
        <img src={volumeImg} alt="Volume" style={{ width: '16px', height: '16px', opacity: 0.7 }} />
        <div
          style={{ position: 'relative', width: '90px', height: '4px', backgroundColor: '#535353', borderRadius: '2px', cursor: 'pointer' }}
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            setVolume(Math.round(ratio * 100));
          }}
        >
          <div style={{
            height: '100%', width: `${volume}%`,
            backgroundColor: '#fff', borderRadius: '2px',
            pointerEvents: 'none',
          }} />
        </div>
      </div>
    </div>
  );
}
