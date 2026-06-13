import { useState, useEffect } from 'react';
import { useMusic } from '../../hooks/MusicContext';
import playButtonImg from '../../assets/icons/play-button.png';
import pauseImg from '../../assets/icons/pause.png';
import nextImg from '../../assets/icons/next-icon.png';
import previousImg from '../../assets/icons/previous-icon.png';

function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function Player() {
  const {
    currentSong, isPlaying, togglePlayPause,
    playNext, playPrevious,
    currentTime, duration, audioRef,
    queue, queueIndex,
  } = useMusic();
  const [volume, setVolume] = useState(70);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume, audioRef]);

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = ratio * duration;
  };

  const hasNext = queue.length > 0 && queueIndex < queue.length - 1;
  const hasPrev = queue.length > 0 && queueIndex > 0;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: '100%',
      padding: '0 1.5rem',
      backgroundColor: '#181818'
    }}>
      {/* Track Info */}
      <div style={{ display: 'flex', alignItems: 'center', width: '250px' }}>
        <div style={{
          width: '60px',
          height: '60px',
          backgroundColor: '#282828',
          borderRadius: '4px',
          marginRight: '1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.5rem',
          overflow: 'hidden',
          flexShrink: 0,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundImage: currentSong?.cover ? `url('${currentSong.cover}')` : 'none'
        }}>
          {!currentSong?.cover && '🎵'}
        </div>
        <div style={{ textAlign: 'left', overflow: 'hidden' }}>
          <p style={{ fontWeight: 'bold', fontSize: '0.875rem', margin: 0, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}>
            {currentSong?.title || 'Now Playing'}
          </p>
          <p style={{ fontSize: '0.75rem', margin: '0.25rem 0 0 0', color: '#b3b3b3', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}>
            {currentSong?.artist || 'No track selected'}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: '0 1rem', gap: '0.5rem' }}>
        {/* Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5rem' }}>
          <button
            onClick={playPrevious}
            disabled={!hasPrev && !(audioRef.current && audioRef.current.currentTime > 3)}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              cursor: hasPrev ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '30px',
              height: '30px',
              padding: 0,
              opacity: hasPrev ? 0.7 : 0.3,
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={(e) => { if (hasPrev) e.currentTarget.style.opacity = '1'; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = hasPrev ? '0.7' : '0.3'; }}
            title="Previous"
          >
            <img src={previousImg} alt="Previous" style={{ width: '18px', height: '18px', objectFit: 'contain' }} />
          </button>

          <button
            onClick={togglePlayPause}
            style={{
              backgroundColor: '#1db954',
              border: 'none',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              padding: 0,
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1ed760'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1db954'}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            <img
              src={isPlaying ? pauseImg : playButtonImg}
              alt={isPlaying ? 'Pause' : 'Play'}
              style={{ width: '20px', height: '20px', objectFit: 'contain' }}
            />
          </button>

          <button
            onClick={playNext}
            disabled={!hasNext}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              cursor: hasNext ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '30px',
              height: '30px',
              padding: 0,
              opacity: hasNext ? 0.7 : 0.3,
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={(e) => { if (hasNext) e.currentTarget.style.opacity = '1'; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = hasNext ? '0.7' : '0.3'; }}
            title="Next"
          >
            <img src={nextImg} alt="Next" style={{ width: '18px', height: '18px', objectFit: 'contain' }} />
          </button>
        </div>

        {/* Progress Bar + Time */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', maxWidth: '400px' }}>
          <span style={{ fontSize: '0.7rem', color: '#b3b3b3', minWidth: '32px', textAlign: 'right' }}>
            {formatTime(currentTime)}
          </span>
          <div
            onClick={handleProgressClick}
            style={{
              flex: 1,
              height: '4px',
              backgroundColor: '#404040',
              borderRadius: '2px',
              cursor: 'pointer',
              position: 'relative',
            }}
          >
            <div style={{
              height: '100%',
              width: `${progressPercent}%`,
              backgroundColor: '#1db954',
              borderRadius: '2px',
              pointerEvents: 'none',
            }} />
          </div>
          <span style={{ fontSize: '0.7rem', color: '#b3b3b3', minWidth: '32px' }}>
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* Volume */}
      <div style={{ display: 'flex', alignItems: 'center', width: '250px', justifyContent: 'flex-end', gap: '0.5rem' }}>
        <span style={{ fontSize: '0.875rem', color: '#b3b3b3' }}>🔊</span>
        <input
          type="range"
          min="0"
          max="100"
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          style={{
            width: '100px',
            height: '4px',
            borderRadius: '2px',
            outline: 'none',
            cursor: 'pointer',
            accentColor: '#1db954'
          }}
        />
        <span style={{ fontSize: '0.75rem', color: '#b3b3b3', minWidth: '30px' }}>{volume}%</span>
      </div>
    </div>
  );
}
