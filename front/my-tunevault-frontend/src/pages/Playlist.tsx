import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiService from '../services/ApiService';
import { useMusic } from '../hooks/MusicContext';
import type { Playlist } from '../types';

export default function PlaylistPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { setQueue } = useMusic();
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlaylist = async () => {
      if (!id) return;
      try {
        setIsLoading(true);
        const data = await apiService.getPlaylist(id);
        setPlaylist(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load playlist');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlaylist();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex flex-col p-6">
        <h2 className="text-3xl font-bold mb-6 text-white">Playlist</h2>
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  if (error || !playlist) {
    return (
      <div className="flex flex-col p-6">
        <h2 className="text-3xl font-bold mb-6 text-white">Playlist</h2>
        <p className="text-red-600">{error || 'Playlist not found'}</p>
        <button onClick={() => navigate('/library')} className="mt-4 px-4 py-2 bg-green-500 rounded-md w-fit">Back to library</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col p-6">
      <h2 className="text-3xl font-bold mb-2 text-white">{playlist.title}</h2>
      {playlist.description && (
        <p className="text-sm text-gray-400 mb-4">{playlist.description}</p>
      )}
      <p className="text-xs text-gray-500 mb-6">{playlist.trackCount || 0} tracks</p>
      <div className="bg-[#282828] p-6 rounded-lg">
        {playlist.tracks && playlist.tracks.length > 0 ? (
          <div className="flex flex-col gap-3">
            {playlist.tracks.map((track, idx) => (
              <div
                key={track.id}
                onClick={() => setQueue(playlist.tracks || [], idx)}
                className="flex items-center justify-between p-3 bg-[#1e1e1e] hover:bg-green-700 hover:scale-105 rounded-md transition-all duration-200 cursor-pointer group origin-left"
              >
                <div className="flex items-center gap-3 flex-1 ">
                    {track.cover ? (
                      <img src={track.cover} alt={track.title} className="w-12 h-12 object-cover rounded group-hover:brightness-75 transition-all duration-200" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                    ) : (
                      <div className="w-12 h-12 bg-[#1e1e1e] rounded flex items-center justify-center text-gray-500 group-hover:bg-[#2a2a2a] transition-all duration-200"></div>
                    )}
                    <div className="song-info flex-1 flex flex-col gap-1 min-w-0 hover:text-green-400 transition-colors duration-200">
                      <div className="font-bold text-white truncate group-hover:text-green-400 transition-colors duration-200">{track.title}</div>
                      <div className="text-gray-400 text-sm truncate group-hover:text-gray-300 transition-colors duration-200">{track.artist}</div>
                    </div>
                </div>
                
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 m-0">No tracks in this playlist</p>
        )}
      </div>
    </div>
  );
}
