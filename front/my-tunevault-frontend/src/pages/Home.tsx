import { useMusic, type Song } from '../hooks/MusicContext';
import playButtonImg from 'D:\\tune_vault\\CSharp\\front\\my-tunevault-frontend\\src\\assets\\icons\\play-button.png';
import pauseImg from 'D:\\tune_vault\\CSharp\\front\\my-tunevault-frontend\\src\\assets\\icons\\pause.png';

const songs: Song[] = [
  { 
    id: 1, 
    title: "I Can't Feel", 
    artist: 'Aylex', 
    cover: '/src/assets/images/Black  Mixtape Cover  Album Cover - Made with PosterMyWall.jpg',
    audio: '/src/assets/Audio/Aylex - I Can\'t Feel (freetouse.com).mp3'
  },
  { 
    id: 2, 
    title: 'Turn It Louder', 
    artist: 'Aylex', 
    cover: '/src/assets/images/Black Floral Illustrative Album Cover - Made with PosterMyWall.jpg',
    audio: '/src/assets/Audio/Aylex - Turn It Louder (freetouse.com).mp3'
  },
  { 
    id: 3, 
    title: 'All Night', 
    artist: 'Burgundy', 
    cover: '/src/assets/images/Black Indie Rock Album Cover - Made with PosterMyWall.jpg',
    audio: '/src/assets/Audio/Burgundy - All Night (freetouse.com).mp3'
  },
  { 
    id: 4, 
    title: 'Clarity', 
    artist: 'Damtaro', 
    cover: '/src/assets/images/Blue Inception Album Cover - Made with PosterMyWall.jpg',
    audio: '/src/assets/Audio/Damtaro - Clarity (freetouse.com).mp3'
  },
  { 
    id: 5, 
    title: 'Wandering', 
    artist: 'Epic Spectrum', 
    cover: '/src/assets/images/Neon Music Album Cover Album Cover - Made with PosterMyWall.jpg',
    audio: '/src/assets/Audio/Epic Spectrum - Wandering (freetouse.com).mp3'
  },
  { 
    id: 6, 
    title: 'End of Times', 
    artist: 'Guillermo Guareschi', 
    cover: '/src/assets/images/Pink Modern  Minimal Music Album Cover Album Cover - Made with PosterMyWall.jpg',
    audio: '/src/assets/Audio/Guillermo Guareschi - End of Times (freetouse.com).mp3'
  },
  { 
    id: 7, 
    title: 'Memories', 
    artist: 'Lukrembo', 
    cover: '/src/assets/images/Pop Album Cover - Made with PosterMyWall.jpg',
    audio: '/src/assets/Audio/Lukrembo - Memories (freetouse.com).mp3'
  },
  { 
    id: 8, 
    title: 'Kyoto', 
    artist: 'Nebulite', 
    cover: '/src/assets/images/Purple Abstract Album Cover - Made with PosterMyWall.jpg',
    audio: '/src/assets/Audio/Nebulite - Kyoto (freetouse.com).mp3'
  },
  { 
    id: 9, 
    title: 'Deep Within', 
    artist: 'Sunborn', 
    cover: '/src/assets/images/Red Neon Music Album Cover Album Cover - Made with PosterMyWall.jpg',
    audio: '/src/assets/Audio/Sunborn - Deep Within (freetouse.com).mp3'
  },
  { 
    id: 10, 
    title: 'Final Scene', 
    artist: 'Walen', 
    cover: '/src/assets/images/Square abstract album cover template - Made with PosterMyWall.jpg',
    audio: '/src/assets/Audio/Walen - Final Scene (freetouse.com).mp3'
  },
];

export default function Home() {
  const { currentSong, isPlaying, playSong } = useMusic();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem', padding: '2rem' }}>
      {/* Sector 1 */}
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#fff' }}>
          🎵 Featured Tracks
        </h2>
        <div style={{
          display: 'flex',
          gap: '1.5rem',
          justifyContent: 'space-between'
        }}>
          {songs.slice(0, 5).map((song) => (
            <div
              key={song.id}
              onClick={() => playSong(song)}
              style={{
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'transform 0.3s, box-shadow 0.3s',
                transform: currentSong?.id === song.id ? 'scale(1.05)' : 'scale(1)',
                boxShadow: currentSong?.id === song.id ? '0 0 20px rgba(29, 185, 84, 0.6)' : '0 4px 12px rgba(0,0,0,0.3)',
                borderRadius: '8px',
                overflow: 'hidden',
                position: 'relative',
                flex: 1
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = `scale(1.08)`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = currentSong?.id === song.id ? 'scale(1.05)' : 'scale(1)';
              }}
            >
              <img
                src={song.cover}
                alt={song.title}
                style={{
                  width: '100%',
                  height: '180px',
                  objectFit: 'cover',
                  borderRadius: '8px',
                  display: 'block'
                }}
              />

              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                opacity: currentSong?.id === song.id ? 1 : 0,
                transition: 'opacity 0.3s',
                borderRadius: '8px'
              }}>
                <span style={{ fontSize: '2.5rem' }}>
                  {currentSong?.id === song.id && isPlaying ? (
                    <img src={pauseImg} alt="Pause" style={{ width: '10%', height: '10%' }} />
                  ) : (
                    <img src={playButtonImg} alt="Play" style={{ width: '10%', height: '10%' }} />
                  )}
                </span>
              </div>

              <div style={{ padding: '1rem', backgroundColor: '#282828', borderRadius: '0 0 8px 8px' }}>
                <p style={{ fontWeight: 'bold', fontSize: '0.875rem', margin: '0.5rem 0', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {song.title}
                </p>
                <p style={{ fontSize: '0.75rem', margin: 0, color: '#b3b3b3', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {song.artist}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sector 2 */}
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#fff' }}>
          🎸 More Tracks
        </h2>
        <div style={{
          display: 'flex',
          gap: '1.5rem',
          justifyContent: 'space-between'
        }}>
          {songs.slice(5, 10).map((song) => (
            <div
              key={song.id}
              onClick={() => playSong(song)}
              style={{
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'transform 0.3s, box-shadow 0.3s',
                transform: currentSong?.id === song.id ? 'scale(1.05)' : 'scale(1)',
                boxShadow: currentSong?.id === song.id ? '0 0 20px rgba(29, 185, 84, 0.6)' : '0 4px 12px rgba(0,0,0,0.3)',
                borderRadius: '8px',
                overflow: 'hidden',
                position: 'relative',
                flex: 1
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = `scale(1.08)`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = currentSong?.id === song.id ? 'scale(1.05)' : 'scale(1)';
              }}
            >
              <img
                src={song.cover}
                alt={song.title}
                style={{
                  width: '100%',
                  height: '180px',
                  objectFit: 'cover',
                  borderRadius: '8px',
                  display: 'block'
                }}
              />

              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                opacity: currentSong?.id === song.id ? 1 : 0,
                transition: 'opacity 0.3s',
                borderRadius: '8px'
              }}>
                <span style={{ fontSize: '2.5rem' }}>
                  {currentSong?.id === song.id && isPlaying ? (
                    <img src={pauseImg} alt="Pause" style={{ width: '10%', height: '10%' }} />
                  ) : (
                    <img src={playButtonImg} alt="Play" style={{ width: '10%', height: '10%' }} />
                  )}
                </span>
              </div>

              <div style={{ padding: '1rem', backgroundColor: '#282828', borderRadius: '0 0 8px 8px' }}>
                <p style={{ fontWeight: 'bold', fontSize: '0.875rem', margin: '0.5rem 0', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {song.title}
                </p>
                <p style={{ fontSize: '0.75rem', margin: 0, color: '#b3b3b3', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {song.artist}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
