import { useMusic } from '../../hooks/MusicContext';
import styles from './SongDetails.module.css';

export default function SongDetails() {
  const { currentSong } = useMusic();

  if (!currentSong) {
    return (
      <div className={styles.emptyWrap}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎵</div>
        <p>No song selected</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div
        className={styles.coverBox}
        style={{ backgroundImage: currentSong.cover ? `url(${currentSong.cover})` : undefined }}
      >
        {!currentSong.cover && '🎵'}
      </div>

      <h2 className={styles.title}>{currentSong.title}</h2>
      <p className={styles.artist}>{currentSong.artist}</p>
    </div>
  );
}
