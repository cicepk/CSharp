export default function Library() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <h2 style={{
        fontSize: '1.875rem',
        fontWeight: 'bold',
        marginBottom: '1.5rem',
        color: '#fff'
      }}>
        Your Library
      </h2>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        gap: '1rem'
      }}>
        <div style={{
          backgroundColor: '#282828',
          padding: '1rem',
          borderRadius: '8px',
          cursor: 'pointer',
          transition: 'background-color 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#333'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#282828'}
        >
          <p style={{ color: '#b3b3b3', margin: 0 }}>No playlists yet</p>
        </div>
      </div>
    </div>
  );
}
