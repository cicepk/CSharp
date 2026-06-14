import { useMusic } from '../../hooks/MusicContext';
import playButtonImg from '../../assets/icons/play-button.png';
import pauseImg from '../../assets/icons/pause.png';
import nextImg from '../../assets/icons/next-icon.png';
import previousImg from '../../assets/icons/previous-icon.png';

export default function Player() {
  const { isPlaying, togglePlayPause, volume, setVolume, currentSong, isFavorite, toggleFavorite } = useMusic();

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
          backgroundImage: currentSong?.cover ? `url(${currentSong.cover})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}>
          {!currentSong?.cover && '🎵'}
        </div>
        <div style={{ textAlign: 'left' }}>
          <p style={{ fontWeight: 'bold', fontSize: '0.875rem', margin: 0, color: '#fff' }}>
            {currentSong?.title || 'Now Playing'}
          </p>
          <p style={{ fontSize: '0.75rem', margin: '0.25rem 0 0 0', color: '#b3b3b3' }}>
            {currentSong?.artist || 'No track selected'}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: '0 1rem', gap: '0.75rem' }}>
        {/* Buttons Container */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5rem' }}>
          <button style={{
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '30px',
            height: '30px',
            transition: 'opacity 0.2s',
            padding: 0,
            opacity: 0.7
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
          title="Previous"
          >
            <img
              src={previousImg}
              alt="Previous"
              style={{
                width: '18px',
                height: '18px',
                objectFit: 'contain'
              }}
            />
          </button>
          <button
            onClick={() => togglePlayPause()}
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
              transition: 'background-color 0.2s',
              padding: 0
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1ed760'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1db954'}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            <img
              src={isPlaying ? pauseImg : playButtonImg}
              alt={isPlaying ? 'Pause' : 'Play'}
              style={{
                width: '20px',
                height: '20px',
                objectFit: 'contain'
              }}
            />
          </button>
          <button style={{
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '30px',
            height: '30px',
            transition: 'opacity 0.2s',
            padding: 0,
            opacity: 0.7
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
          title="Next"
          >
            <img
              src={nextImg}
              alt="Next"
              style={{
                width: '18px',
                height: '18px',
                objectFit: 'contain'
              }}
            />
          </button>
          {/* Favorite / Heart button (to the right of Next) */}
          <button
            onClick={() => { if (currentSong) toggleFavorite(currentSong); }}
            title={currentSong && isFavorite(currentSong.id) ? 'Unfavorite' : 'Add to favorites'}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              cursor: currentSong ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '30px',
              height: '30px',
              transition: 'opacity 0.2s',
              padding: 0,
              opacity: currentSong ? 0.9 : 0.4
            }}
          >
            {/* Inline SVG heart with dynamic stroke/fill */}
            <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M12.1 21.35l-1.1-1.01C5.14 15.24 2 12.39 2 8.99 2 6.12 4.24 4 6.99 4c1.64 0 3.08.81 4.01 2.09C11.93 4.81 13.37 4 15.01 4 17.76 4 20 6.12 20 8.99c0 3.4-3.14 6.25-8.99 11.35l-1.11 1.02z"
                fill={currentSong && isFavorite(currentSong.id) ? '#e0245e' : 'none'}
                stroke={currentSong && isFavorite(currentSong.id) ? '#e0245e' : '#b3b3b3'}
                strokeWidth="1"
              />
            </svg>
          </button>
        </div>
        {/* Progress Bar */}
        <div style={{
          width: '384px',
          height: '4px',
          backgroundColor: '#404040',
          borderRadius: '2px',
          position: 'relative'
        }}>
          <div style={{
            height: '100%',
            width: '0%',
            backgroundColor: '#1db954',
            borderRadius: '2px'
          }}></div>
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
            backgroundColor: '#404040',
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
