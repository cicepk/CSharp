export default function Search() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <input
          type="text"
          placeholder="Search songs, artists, albums..."
          style={{
            width: '100%',
            padding: '0.75rem 1rem',
            backgroundColor: '#282828',
            color: '#fff',
            border: 'none',
            borderRadius: '9999px',
            fontSize: '1rem',
            outline: 'none',
            boxShadow: '0 0 0 2px transparent',
            transition: 'box-shadow 0.2s'
          }}
          onFocus={(e) => e.currentTarget.style.boxShadow = '0 0 0 2px #1db954'}
          onBlur={(e) => e.currentTarget.style.boxShadow = '0 0 0 2px transparent'}
        />
      </div>
      <div>
        <p style={{ color: '#b3b3b3', fontSize: '1rem' }}>Start searching to discover music</p>
      </div>
    </div>
  );
}
