import { useMusic } from '../../hooks/MusicContext';

export default function SongDetails() {
  const { currentSong } = useMusic();

  if (!currentSong) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        backgroundColor: '#121212',
        borderLeft: '1px solid #282828',
        color: '#b3b3b3',
        padding: '2rem'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎵</div>
        <p>No song selected</p>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '2rem',
      backgroundColor: '#121212',
      borderLeft: '1px solid #282828',
      height: '100%',
      overflowY: 'auto'
    }}>
      {/* Album Cover */}
      <div style={{
        width: '200px',
        height: '200px',
        borderRadius: '8px',
        marginBottom: '2rem',
        backgroundImage: currentSong.cover ? `url(${currentSong.cover})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundColor: '#282828',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '3rem',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)'
      }}>
        {!currentSong.cover && '🎵'}
      </div>

      {/* Song Title */}
      <h2 style={{
        fontSize: '1.75rem',
        fontWeight: 'bold',
        color: '#fff',
        margin: '0 0 0.5rem 0',
        textAlign: 'center',
        wordBreak: 'break-word'
      }}>
        {currentSong.title}
      </h2>

      {/* Artist */}
      <p style={{
        fontSize: '1.125rem',
        color: '#b3b3b3',
        margin: '0 0 2rem 0',
        textAlign: 'center'
      }}>
        {currentSong.artist}
      </p>

      {/* Song Info removed */}
    </div>
  );
}
