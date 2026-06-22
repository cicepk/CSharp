import { useMusic } from '../hooks/MusicContext';
import styles from './NowPlayingPanel.module.css';

const FALLBACK_COVER = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23282828" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23535353" font-size="56"%3E%F0%9F%8E%B5%3C/text%3E%3C/svg%3E';

export default function NowPlayingPanel() {
  const { currentSong } = useMusic();

  return (
    <div className={styles.panel}>
      {/* Header label */}
      <div className={styles.headerLabel}><p>NOW PLAYING</p></div>

      <div className={styles.coverWrap}>
        <img src={currentSong?.cover || FALLBACK_COVER} alt={currentSong?.title || 'No track'} onError={(e) => { e.currentTarget.src = FALLBACK_COVER; }} className={styles.coverImg} />
      </div>

      <div className={styles.trackInfo}>
        <p className={styles.trackTitle} style={{ color: currentSong ? '#fff' : '#535353' }}>{currentSong?.title || 'No track selected'}</p>
        <p className={styles.trackArtist}>{currentSong?.artist || ''}</p>
      </div>

      <div className={styles.divider} />

      <div className={styles.about}>
        <p className={styles.aboutTitle}>About the artist</p>

        {currentSong ? (
          <>
            <div className={styles.avatar}><img src={currentSong.cover || FALLBACK_COVER} alt={currentSong.artist} onError={(e) => { e.currentTarget.src = FALLBACK_COVER; }} /></div>

            <p className={styles.aboutName}>{currentSong.artist}</p>

            <p className={styles.aboutText}>Creative Commons artist</p>

            {currentSong.ownerUsername && (
              <p className={styles.aboutText}>Uploaded by <span style={{ color: '#1db954' }}>@{currentSong.ownerUsername}</span></p>
            )}
          </>
        ) : (
          <p className={styles.placeholder}>Play a track to see artist info</p>
        )}
      </div>
    </div>
  );
}
