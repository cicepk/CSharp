import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiService from '../services/ApiService';
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

  if (!id) return <div className="p-6 text-white">Collection id missing</div>;

  if (!collection)
    return (
      <div className="p-6 text-white">
        <h2 className="text-2xl font-bold">Collection not found</h2>
        <p className="text-gray-400 mt-2">This collection doesn't exist or was removed.</p>
        <button onClick={() => navigate('/library')} className="mt-4 px-4 py-2 bg-green-500 rounded-md">
          Back to library
        </button>
      </div>
    );

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold text-white mb-4">{collection.name}</h2>

      {isLoading ? (
        <p className="text-gray-400">Loading...</p>
      ) : (
        <div className="grid gap-5">
          {songs.length === 0 ? (
            <div className="text-gray-400">No songs in this collection yet.</div>
          ) : (
            songs.map((song, idx) => (
              <div
                key={song.id}
                onClick={() => setQueue(songs, idx)}
                className="flex items-center justify-between p-3 bg-[#1e1e1e] hover:bg-green-700 hover:scale-105 rounded-md transition-all duration-200 cursor-pointer min-h-[64px] gap-4 group origin-left"
              >
                <div className="flex items-center gap-4 flex-1">
                  {song.cover ? (
                    <img
                      src={song.cover}
                      alt={song.title}
                      className="w-14 h-14 object-cover rounded-md group-hover:brightness-75 transition-all duration-200"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-14 h-14 bg-[#1e1e1e] rounded-md flex items-center justify-center text-gray-500 group-hover:bg-[#2a2a2a] transition-all duration-200"></div>
                  )}

                  <div className="song-info flex-1 flex flex-col gap-1 min-w-0">
                    <div className="font-bold text-white truncate group-hover:text-green-400 transition-colors duration-200">{song.title}</div>
                    <div className="text-gray-400 text-sm truncate group-hover:text-gray-300 transition-colors duration-200">{song.artist}</div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeSongFromCollection(collection.id, song.id);
                    }}
                    className="bg-transparent border border-gray-700 px-2 py-1 rounded-md text-gray-400 hover:bg-gray-700 hover:text-white transition min-w-max mx-auto my-auto"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
