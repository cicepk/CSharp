import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/ApiService';
import type { Playlist } from '../types';
import { useMusic } from '../hooks/MusicContext';
import { useAuth } from '../contexts/AuthContext';

export default function Library() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  // favourites list no longer stored locally in this page
  const [newCollectionName, setNewCollectionName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const { collections, createCollection } = useMusic();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const fetchPlaylists = async () => {
      try {
        setIsLoading(true);
        const items = await apiService.getPlaylists();
        setPlaylists(items);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load playlists');
      } finally {
        setIsLoading(false);
      }
    };

    const fetchAll = async () => {
      await fetchPlaylists();

      try {
        if (isAuthenticated) {
          const favIds = await apiService.getFavourites();
          if (favIds.length > 0) {
            const allSongs = await apiService.getSongs();
            const favSongs = allSongs.filter((s) => favIds.includes(s.id));

            // ensure context has a default collection
            if (!collections.some(c => c.id === 'col-favorite' || c.name.toLowerCase() === 'my favorites' || c.name.toLowerCase() === 'favorite')) {
              createCollection('My Favorites', favSongs.map((s) => s.id));
            }
          } else {
            // no favourites
          }
        } else {
          // not authenticated: load favourites and collections from localStorage
          const rawFav = localStorage.getItem('favorites');
          const favIds: string[] = rawFav ? JSON.parse(rawFav) : [];
          if (favIds.length > 0) {
            const allSongs = await apiService.getSongs();
            const favSongs = allSongs.filter((s) => favIds.includes(s.id));
            // ensure default collection exists for unauth users
            if (!collections.some(c => c.id === 'col-favorite' || c.name.toLowerCase() === 'my favorites' || c.name.toLowerCase() === 'favorite')) {
              createCollection('My Favorites', favSongs.map((s) => s.id));
            }
          }
          // for unauthenticated users, collections are stored in localStorage; try to load into context
          try {
            const rawCols = localStorage.getItem('fav_collections');
            if (rawCols) {
              const parsed = JSON.parse(rawCols) as Array<{ id: string; name: string; songIds: string[] }>;
              // create any collections that don't exist in context yet
              parsed.forEach(col => {
                if (!collections.some(c => c.id === col.id || c.name === col.name)) {
                  createCollection(col.name, col.songIds);
                }
              });
            }
          } catch {
            // ignore
          }
        }
      } catch {
        // ignore
      }
    };

    fetchAll();
  }, [isAuthenticated]);

  // persist context collections into localStorage for unauthenticated use
  useEffect(() => {
    try {
      localStorage.setItem('fav_collections', JSON.stringify(collections));
    } catch {
      // ignore
    }
  }, [collections]);

  if (isLoading) {
    return (
      <div className="flex flex-col">
        <h2 className="text-2xl font-bold mb-6 text-white">Your Library</h2>
        <p className="text-gray-400">Loading playlists...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col">
        <h2 className="text-2xl font-bold mb-6 text-white">Your Library</h2>
        <p className="text-red-600">Error: {error}</p>
      </div>
    );
  }

  // helpers
  const openCollection = (id: string) => navigate(`/collection/${id}`);

  return (
    <div className="flex flex-col w-full h-full">
      <h2 className="text-xl md:text-2xl lg:text-3xl font-bold mb-4 md:mb-6 text-white px-2 md:px-0">Your Library</h2>

      {/* Collections */}
      <div className="mb-6 md:mb-8 px-2 md:px-0">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 md:gap-4 mb-4">
          <h3 className="text-base md:text-lg font-bold text-white">Favorite Collections</h3>
          <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
            <input 
              value={newCollectionName} 
              onChange={(e) => setNewCollectionName(e.target.value)} 
              placeholder="New collection name (e.g. Chill & Relax)" 
              className="flex-1 md:flex-none p-2 rounded-md border border-gray-700 bg-gray-900 text-white text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500" 
            />
            <button 
              onClick={() => {
                const name = newCollectionName.trim();
                if (!name) return;
                createCollection(name);
                setNewCollectionName('');
              }} 
              className="px-4 py-2 bg-green-500 hover:bg-green-600 rounded-md text-sm font-medium text-black transition-colors whitespace-nowrap"
            >
              Create
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-4">
          {collections.length === 0 && (
            <div className="col-span-2 sm:col-span-3 md:col-span-4 lg:col-span-5 xl:col-span-6 bg-[#282828] p-4 rounded-md text-gray-400 text-sm md:text-base">No collections yet</div>
          )}

          {collections.map((col) => (
            <div 
              key={col.id} 
              onClick={() => openCollection(col.id)} 
              className="collection-card rounded-md p-3 cursor-pointer flex flex-col justify-between transition-colors hover:bg-[#333333] h-full bg-[#282828] group"
            >
              <div className="flex-1">
                <div className="font-bold text-white truncate text-sm md:text-base group-hover:text-green-400 transition-colors">{col.name}</div>
                <div className="text-gray-400 text-xs md:text-sm">{col.songIds.length} tracks</div>
              </div>
              <div className="text-gray-400 text-xs md:text-sm mt-2 group-hover:text-green-400 transition-colors">Open</div>
            </div>
          ))}
        </div>
      </div>

      {/* Playlists */}
      <div className="mb-6 md:mb-8 px-2 md:px-0">
        <h3 className="text-base md:text-lg font-bold text-white mb-4">Playlists</h3>
        {playlists.length === 0 ? (
          <div className="bg-[#282828] p-4 rounded-md text-gray-400 text-sm md:text-base">No playlists yet</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-4">
            {playlists.map((playlist) => (
              <div 
                key={playlist.id} 
                onClick={() => navigate(`/playlist/${playlist.id}`)} 
                className="bg-[#282828] rounded-md cursor-pointer transition-all overflow-hidden hover:bg-[#333333] hover:shadow-lg flex flex-col h-full group"
              >
                {playlist.cover ? (
                  <img src={playlist.cover} alt={playlist.title} className="w-full h-24 sm:h-32 md:h-40 object-cover block group-hover:opacity-75 transition-opacity" />
                ) : (
                  <div className="w-full h-24 sm:h-32 md:h-40 bg-[#1e1e1e] flex items-center justify-center text-gray-500 text-2xl sm:text-3xl md:text-4xl group-hover:bg-[#2a2a2a] transition-colors"></div>
                )}
                <div className="collection-card rounded-md p-3 cursor-pointer flex flex-col justify-between transition-colors hover:bg-[#333333] h-full bg-[#282828] group">
                  <p className="font-bold text-xs md:text-sm mb-1 md:mb-2 text-white truncate group-hover:text-green-400 transition-colors">{playlist.title}</p>
                  <p className="text-xs text-gray-400">{playlist.trackCount || 0} tracks</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
