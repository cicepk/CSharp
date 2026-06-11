export default function Header() {
  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%'
    }}>
      <div>
        <h2 style={{
          fontSize: '1.25rem',
          fontWeight: 'bold',
          margin: 0,
          color: '#fff'
        }}>
          Welcome Back!
        </h2>
      </div>
      <div>
        <button style={{
          backgroundColor: '#1db954',
          color: '#000',
          padding: '0.5rem 1.5rem',
          border: 'none',
          borderRadius: '9999px',
          fontWeight: 'bold',
          cursor: 'pointer',
          fontSize: '1rem',
          transition: 'background-color 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1ed760'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1db954'}
        >
          👤 Profile
        </button>
      </div>
    </header>
  );
}
