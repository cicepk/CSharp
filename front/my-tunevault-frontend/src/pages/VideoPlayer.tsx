import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMusic } from '../hooks/MusicContext';
import apiService from '../services/ApiService';
import styles from './VideoPlayer.module.css';
import arrowLeftImg from '../assets/icons/arrow_left.png';

export default function VideoPlayer() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    currentSong, songs, videoRef, volume, loadVideo,
    onVideoPlay, onVideoPause, onVideoTimeUpdate, onVideoLoadedMetadata, onVideoEnded,
  } = useMusic();
  const [notFound, setNotFound] = useState(false);


  useEffect(() => {
    if (!id || currentSong?.id === id) return;
    const fromQueue = songs.find(s => s.id === id);
    if (fromQueue) {
      loadVideo(fromQueue);
      return;
    }
    apiService.getMediaById(id).then(loadVideo).catch(() => setNotFound(true));
  }, [id, currentSong?.id, songs, loadVideo]);

  const isReady = !!currentSong && currentSong.id === id;


  useEffect(() => {
    if (!isReady || !videoRef.current) return;
    videoRef.current.muted = false;
    videoRef.current.volume = volume / 100;
    videoRef.current.play().catch(() => {});
    return () => onVideoPause();

  }, [isReady]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.volume = volume / 100;
  }, [volume, videoRef]);

  if (notFound) return <p className={styles.message}>Video không tồn tại</p>;
  if (!isReady) return <p className={styles.message}>Đang tải video...</p>;

  return (
    <div className={styles.container}>
      <button className={styles.backButton} onClick={() => navigate(-1)}>
        <img src={arrowLeftImg} alt="Back" style={{ width: '16px', height: '16px' }} />
        Quay lại
      </button>

      <div className={styles.videoWrapper}>
        <video
          ref={videoRef}
          src={currentSong.url}
          className={styles.video}
          onPlay={onVideoPlay}
          onPause={onVideoPause}
          onTimeUpdate={onVideoTimeUpdate}
          onLoadedMetadata={onVideoLoadedMetadata}
          onEnded={onVideoEnded}
        />
      </div>

      <div className={styles.info}>
        <p className={styles.title}>{currentSong.title}</p>
        <p className={styles.artist}>{currentSong.artist}</p>
      </div>
    </div>
  );
}
