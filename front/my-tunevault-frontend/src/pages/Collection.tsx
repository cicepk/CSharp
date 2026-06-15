import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiService from '../services/ApiService';
import styles from './Collection.module.css';
import { useMusic } from '../hooks/MusicContext';
import type { Song } from '../types';

export default function CollectionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { collections, removeSongFromCollection, setQueue } = useMusic();
  const [collection, setCollection] = useState<{ id: string; name: string; songIds: string[] } | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setCollection(null);
      setSongs([]);
      setIsLoading(false);
      return;
    }

    const col = collections.find((c) => c.id === id);
    setCollection(col ?? null);

    let mounted = true;
    (async () => {
      setIsLoading(true);
      try {
        const all = await apiService.getSongs();
        if (!mounted) return;
        if (col) setSongs(all.filter((s) => col.songIds.includes(s.id)));
        else setSongs([]);
      } catch {
        if (mounted) setSongs([]);
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [id, collections]);

  if (!id) return <div className={styles.container}>Collection id missing</div>;

  if (!collection) return (
    <div className={styles.container}>
      <h2 className={styles.title}>Collection not found</h2>
      <p className={styles.loading}>This collection doesn't exist or was removed.</p>
      <button onClick={() => navigate('/library')} style={{ marginTop: '1rem', padding: '0.5rem 1rem', borderRadius: 6 }}>Back to library</button>
    </div>
  );

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>{collection.name}</h2>

      {isLoading ? (
        <p className={styles.loading}>Loading...</p>
      ) : (
        <div className={styles.grid}>
          {songs.length === 0 ? (
            <div className={styles.loading}>No songs in this collection yet.</div>
          ) : (
            songs.map((song, idx) => (
              <div key={song.id} onClick={() => setQueue(songs, idx)} className={styles.card}>
                <div className={styles.left}>
                  {song.cover ? (
                    <img src={song.cover} alt={song.title} className={styles.cover} onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                  ) : (
                    <div className={styles.coverPlaceholder}></div>
                  )}

                  <div className={styles.songInfo}>
                    <div className={styles.songTitle}>{song.title}</div>
                    <div className={styles.songArtist}>{song.artist}</div>
                  </div>
                </div>

                <div>
                  <button onClick={(e) => { e.stopPropagation(); removeSongFromCollection(collection.id, song.id); }} className={styles.removeBtn}>Remove</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
