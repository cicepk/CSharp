import { useMusic } from '../hooks/MusicContext';

const FALLBACK_COVER = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23282828" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23535353" font-size="56"%3E%F0%9F%8E%B5%3C/text%3E%3C/svg%3E';

export default function NowPlayingPanel() {
  const { currentSong } = useMusic();

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: '#121212',
      borderLeft: '1px solid #282828',
      overflowY: 'auto',
    }}>
      {/* Header label */}
      <div style={{ padding: '1rem 1rem 0.5rem', flexShrink: 0 }}>
        <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 700, color: '#fff', letterSpacing: '0.05em' }}>
          NOW PLAYING
        </p>
      </div>

      {/* Cover art */}
      <div style={{ padding: '0 1rem', flexShrink: 0 }}>
        <img
          src={currentSong?.cover || FALLBACK_COVER}
          alt={currentSong?.title || 'No track'}
          onError={(e) => { e.currentTarget.src = FALLBACK_COVER; }}
          style={{
            width: '100%',
            aspectRatio: '1 / 1',
            objectFit: 'cover',
            borderRadius: '8px',
            display: 'block',
          }}
        />
      </div>

      {/* Track info */}
      <div style={{ padding: '1rem', flexShrink: 0 }}>
        <p style={{
          margin: 0,
          fontSize: '1rem',
          fontWeight: 700,
          color: currentSong ? '#fff' : '#535353',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {currentSong?.title || 'No track selected'}
        </p>
        <p style={{
          margin: '4px 0 0',
          fontSize: '0.85rem',
          color: '#b3b3b3',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {currentSong?.artist || ''}
        </p>
      </div>

      {/* Divider */}
      <div style={{ height: '1px', backgroundColor: '#282828', margin: '0 1rem', flexShrink: 0 }} />

      {/* About the artist */}
      <div style={{ padding: '1rem', flex: 1 }}>
        <p style={{
          margin: '0 0 0.75rem',
          fontSize: '0.75rem',
          fontWeight: 700,
          color: '#fff',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
        }}>
          About the artist
        </p>

        {currentSong ? (
          <>
            {/* Artist avatar — dùng cover làm đại diện vì không có artist image riêng */}
            <div style={{
              width: '56px', height: '56px',
              borderRadius: '50%',
              overflow: 'hidden',
              marginBottom: '0.75rem',
              backgroundColor: '#282828',
            }}>
              <img
                src={currentSong.cover || FALLBACK_COVER}
                alt={currentSong.artist}
                onError={(e) => { e.currentTarget.src = FALLBACK_COVER; }}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>

            <p style={{
              margin: '0 0 0.5rem',
              fontSize: '0.9rem',
              fontWeight: 700,
              color: '#fff',
            }}>
              {currentSong.artist}
            </p>

            <p style={{
              margin: 0,
              fontSize: '0.8rem',
              color: '#b3b3b3',
              lineHeight: 1.5,
            }}>
              Creative Commons artist
            </p>
          </>
        ) : (
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#535353' }}>
            Play a track to see artist info
          </p>
        )}
      </div>
    </div>
  );
}
