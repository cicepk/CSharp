import { useParams } from 'react-router-dom';

export default function Playlist() {
  const { id } = useParams<{ id: string }>();

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <h2 style={{
        fontSize: '1.875rem',
        fontWeight: 'bold',
        marginBottom: '1.5rem',
        color: '#fff'
      }}>
        Playlist: {id}
      </h2>
      <div style={{
        backgroundColor: '#282828',
        padding: '1.5rem',
        borderRadius: '8px'
      }}>
        <p style={{ color: '#b3b3b3', margin: 0 }}>Loading playlist tracks...</p>
      </div>
    </div>
  );
}
