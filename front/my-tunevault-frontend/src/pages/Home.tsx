import { useEffect, useRef, useState } from 'react';
import { useMusic } from '../hooks/MusicContext';
import type { Song } from '../types';
import ShareModal from '../components/ShareModal';
import styles from './Home.module.css';
import playButtonImg from '../assets/icons/play-button.png';
import pauseImg from '../assets/icons/pause.png';
import chevronRightImg from '../assets/icons/chevron_right.png';

const VISIBLE_TRACKS = 5;
const GAP_PX = 24; // 1.5rem

const FALLBACK_COVER = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="180" height="180"%3E%3Crect fill="%23282828" width="180" height="180"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23b3b3b3" font-size="40"%3E%F0%9F%8E%B5%3C/text%3E%3C/svg%3E';

function TrackCard({ song, index, songs, width, onShare }: {
  song: Song;
  index: number;
  songs: Song[];
  width: number;
  onShare: (song: Song) => void;
}) {
  const { currentSong, isPlaying, setQueue } = useMusic();
  const isActive = currentSong?.id === song.id;
  const [hovered, setHovered] = useState(false);

  const handleClick = () => {
    setQueue(songs, index);
  };

  return (
    <div
      className={styles.trackCard}
      style={{
        flexBasis: width,
        transform: isActive ? 'scale(1.05)' : hovered ? 'scale(1.08)' : 'scale(1)',
        boxShadow: isActive ? '0 0 20px rgba(29,185,84,0.6)' : '0 4px 12px rgba(0,0,0,0.3)',
      }}
      onClick={handleClick}
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

function TrackCarousel({ tracks, allSongs, indexOffset, onShare }: {
  tracks: Song[];
  allSongs: Song[];
  indexOffset: number;
  onShare: (song: Song) => void;
}) {
  const [scrollIndex, setScrollIndex] = useState(0);
  const [cardWidth, setCardWidth] = useState(180);
  const viewportRef = useRef<HTMLDivElement>(null);
  const maxScrollIndex = Math.max(0, tracks.length - VISIBLE_TRACKS);
  const canScrollLeft = scrollIndex > 0;
  const canScrollRight = scrollIndex < maxScrollIndex;

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const updateWidth = () => {
      setCardWidth((el.clientWidth - GAP_PX * (VISIBLE_TRACKS - 1)) / VISIBLE_TRACKS);
    };
    updateWidth();
    const ro = new ResizeObserver(updateWidth);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const scrollBy = (dir: number) => {
    setScrollIndex(i => Math.min(maxScrollIndex, Math.max(0, i + dir)));
  };

  return (
    <div className={styles.carouselWrapper}>
      {canScrollLeft && (
        <button className={`${styles.navBtn} ${styles.navBtnLeft}`} onClick={() => scrollBy(-1)} title="Trước">
          <img src={chevronRightImg} alt="Previous" style={{ transform: 'scaleX(-1)' }} />
        </button>
      )}

      <div className={styles.viewport} ref={viewportRef}>
        <div className={styles.trackGrid} style={{ transform: `translateX(-${scrollIndex * (cardWidth + GAP_PX)}px)` }}>
          {tracks.map((song, idx) => (
            <TrackCard key={song.id} song={song} index={indexOffset + idx} songs={allSongs} width={cardWidth} onShare={onShare} />
          ))}
        </div>
      </div>

      {canScrollRight && (
        <button className={`${styles.navBtn} ${styles.navBtnRight}`} onClick={() => scrollBy(1)} title="Tiếp">
          <img src={chevronRightImg} alt="Next" />
        </button>
      )}
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
          <TrackCarousel tracks={firstHalf} allSongs={songs} indexOffset={0} onShare={setShareTarget} />
        </div>

        {secondHalf.length > 0 && (
          <div className={styles.section}>
            <h2 className={styles.heading}>🎸 More Tracks</h2>
            <TrackCarousel tracks={secondHalf} allSongs={songs} indexOffset={firstHalf.length} onShare={setShareTarget} />
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