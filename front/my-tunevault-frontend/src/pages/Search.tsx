import { useState } from 'react';
import { useMusic } from '../hooks/MusicContext';
import apiService from '../services/ApiService';
import type { Song } from '../types';
import playButtonImg from '../assets/icons/play-button.png';

const FALLBACK_COVER = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="180" height="180"%3E%3Crect fill="%23282828" width="180" height="180"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23b3b3b3" font-size="40"%3E%F0%9F%8E%B5%3C/text%3E%3C/svg%3E';

export default function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Song[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { currentSong, isPlaying, setQueue } = useMusic();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setIsLoading(true);
    setHasSearched(true);
    try {
      const songs = await apiService.searchSongs(query);
      setResults(songs);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '2rem' }}>
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem' }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search songs, artists..."
          style={{
            flex: 1, padding: '0.75rem 1rem',
            backgroundColor: '#282828', color: '#fff',
            border: 'none', borderRadius: '9999px',
            fontSize: '1rem', outline: 'none',
            transition: 'box-shadow 0.2s',
          }}
          onFocus={(e) => { e.currentTarget.style.boxShadow = '0 0 0 2px #1db954'; }}
          onBlur={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
        />
        <button
          type="submit"
          style={{
            backgroundColor: '#1db954', color: '#000',
            padding: '0.75rem 1.5rem', border: 'none',
            borderRadius: '9999px', fontWeight: 'bold', cursor: 'pointer',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1ed760'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#1db954'; }}
        >
          Search
        </button>
      </form>

      {!hasSearched && <p style={{ color: '#b3b3b3' }}>Start searching to discover music</p>}
      {isLoading && <p style={{ color: '#b3b3b3' }}>Searching...</p>}
      {hasSearched && !isLoading && results.length === 0 && (
        <p style={{ color: '#b3b3b3' }}>No results found</p>
      )}

      {results.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1.5rem' }}>
          {results.map((song, idx) => {
            const isActive = currentSong?.id === song.id;
            return (
              <div
                key={song.id}
                onClick={() => setQueue(results, idx)}
                style={{
                  cursor: 'pointer', borderRadius: '8px',
                  overflow: 'hidden', position: 'relative',
                  transition: 'transform 0.3s',
                  transform: isActive ? 'scale(1.05)' : 'scale(1)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.08)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = isActive ? 'scale(1.05)' : 'scale(1)'; }}
              >
                <img
                  src={song.cover || FALLBACK_COVER}
                  alt={song.title}
                  style={{ width: '100%', height: '180px', objectFit: 'cover', display: 'block' }}
                  onError={(e) => { e.currentTarget.src = FALLBACK_COVER; }}
                />
                <div style={{
                  position: 'absolute', top: '50%', left: '50%',
                  transform: 'translate(-50%, -50%)',
                  backgroundColor: 'rgba(29,185,84,0.9)',
                  borderRadius: '50%', width: '50px', height: '50px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  opacity: isActive && isPlaying ? 1 : 0, transition: 'opacity 0.3s',
                }}>
                  <img src={playButtonImg} alt="Play" style={{ width: '60%', height: '60%' }} />
                </div>
                <div style={{ padding: '0.75rem', backgroundColor: '#282828' }}>
                  <p style={{ fontWeight: 'bold', fontSize: '0.75rem', margin: '0.25rem 0', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {song.title}
                  </p>
                  <p style={{ fontSize: '0.7rem', margin: 0, color: '#b3b3b3', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {song.artist}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
