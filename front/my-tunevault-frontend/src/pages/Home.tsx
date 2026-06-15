import { useState } from 'react';
import { useMusic } from '../hooks/MusicContext';
import type { Song } from '../types';
import ShareModal from '../components/ShareModal';
import styles from './Home.module.css';
import playButtonImg from '../assets/icons/play-button.png';
import pauseImg from '../assets/icons/pause.png';

const FALLBACK_COVER = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="180" height="180"%3E%3Crect fill="%23282828" width="180" height="180"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23b3b3b3" font-size="40"%3E%F0%9F%8E%B5%3C/text%3E%3C/svg%3E';

function TrackCard({ song, index, songs, onShare }: {
  song: Song;
  index: number;
  songs: Song[];
  onShare: (song: Song) => void;
}) {
  const { currentSong, isPlaying, setQueue } = useMusic();
  const isActive = currentSong?.id === song.id;
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={styles.trackCard}
      style={{
        transform: isActive ? 'scale(1.05)' : hovered ? 'scale(1.08)' : 'scale(1)',
        boxShadow: isActive ? '0 0 20px rgba(29,185,84,0.6)' : '0 4px 12px rgba(0,0,0,0.3)',
      }}
      onClick={() => setQueue(songs, index)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <img
        src={song.cover || FALLBACK_COVER}
        alt={song.title}
        className={styles.trackImg}
        onError={(e) => { e.currentTarget.src = FALLBACK_COVER; }}
      />

      {/* Hover / active overlay */}
      <div className={styles.hoverOverlay} style={{ opacity: isActive || hovered ? 1 : 0 }}>
        <img
          src={isActive && isPlaying ? pauseImg : playButtonImg}
          alt={isActive && isPlaying ? 'Pause' : 'Play'}
          style={{ width: '36px', height: '36px' }}
        />
        {/* Share button */}
        <button
          onClick={(e) => { e.stopPropagation(); onShare(song); }}
          title="Share"
          className={styles.shareBtn}
        >
          ↗
        </button>
      </div>

      <div className={styles.cardInfo}>
        <p className={styles.titleText}>{song.title}</p>
        <p className={styles.subText}>{song.artist}</p>
      </div>
    </div>
  );
}

export default function Home() {
  const { songs, songsLoading } = useMusic();
  const [shareTarget, setShareTarget] = useState<Song | null>(null);

  if (songsLoading) return <p style={{ color: '#b3b3b3', padding: '2rem' }}>Loading music...</p>;
  if (songs.length === 0) return <p style={{ color: '#b3b3b3', padding: '2rem' }}>No music available</p>;

  const firstHalf = songs.slice(0, Math.ceil(songs.length / 2));
  const secondHalf = songs.slice(Math.ceil(songs.length / 2));

  return (
    <>
      <div className={styles.container}>
        <div className={styles.section}>
          <h2 className={styles.heading}>🎵 Featured Tracks</h2>
          <div className={styles.trackGrid}>
            {firstHalf.map((song, idx) => (
              <TrackCard key={song.id} song={song} index={idx} songs={songs} onShare={setShareTarget} />
            ))}
          </div>
        </div>

        {secondHalf.length > 0 && (
          <div className={styles.section}>
            <h2 className={styles.heading}>🎸 More Tracks</h2>
            <div className={styles.trackGrid}>
              {secondHalf.map((song, idx) => (
                <TrackCard key={song.id} song={song} index={firstHalf.length + idx} songs={songs} onShare={setShareTarget} />
              ))}
            </div>
          </div>
        )}
      </div>

      {shareTarget && (
        <ShareModal
          mediaItemId={shareTarget.id}
          title={`${shareTarget.title} — ${shareTarget.artist}`}
          onClose={() => setShareTarget(null)}
        />
      )}
    </>
  );
}