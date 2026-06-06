import { NavLink } from 'react-router-dom';
import { useMusic } from '../../hooks/MusicContext';
import playButtonImg from '../../assets/icons/play-button.png';
import pauseImg from '../../assets/icons/pause.png';

export default function Sidebar() {
  const { currentSong, isPlaying, togglePlayPause } = useMusic();
  return (
    <aside style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      padding: '1.5rem 0'
    }}>
      {/* Logo */}
      <div style={{ padding: '0 1.5rem', marginBottom: '2rem' }}>
        <h1 style={{
          fontSize: '1.5rem',
          fontWeight: 'bold',
          color: '#1db954',
          margin: 0
        }}>
          🎵 TuneVault
        </h1>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <NavLink
          to="/"
          style={({ isActive }) => ({
            display: 'block',
            padding: '0.75rem 1.5rem',
            color: isActive ? '#000' : '#b3b3b3',
            backgroundColor: isActive ? '#1db954' : 'transparent',
            textDecoration: 'none',
            cursor: 'pointer',
            fontWeight: isActive ? 'bold' : 'normal',
            transition: 'all 0.2s'
          })}
        >
          🏠 Home
        </NavLink>
        <NavLink
          to="/search"
          style={({ isActive }) => ({
            display: 'block',
            padding: '0.75rem 1.5rem',
            color: isActive ? '#000' : '#b3b3b3',
            backgroundColor: isActive ? '#1db954' : 'transparent',
            textDecoration: 'none',
            cursor: 'pointer',
            fontWeight: isActive ? 'bold' : 'normal',
            transition: 'all 0.2s'
          })}
        >
          🔍 Search
        </NavLink>
        <NavLink
          to="/library"
          style={({ isActive }) => ({
            display: 'block',
            padding: '0.75rem 1.5rem',
            color: isActive ? '#000' : '#b3b3b3',
            backgroundColor: isActive ? '#1db954' : 'transparent',
            textDecoration: 'none',
            cursor: 'pointer',
            fontWeight: isActive ? 'bold' : 'normal',
            transition: 'all 0.2s'
          })}
        >
          📚 Library
        </NavLink>
      </nav>


      {/* Footer */}
      <div style={{
        paddingTop: '1rem',
        borderTop: '1px solid #282828',
        padding: '1rem 1.5rem',
        textAlign: 'center'
      }}>
        <p style={{ fontSize: '0.75rem', color: '#6b6b6b', margin: 0 }}>© 2026 TuneVault</p>
      </div>
    </aside>
  );
}
