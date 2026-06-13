import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

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
          Welcome Back, {user?.username || 'User'}!
        </h2>
      </div>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <button style={{
          backgroundColor: '#282828',
          color: '#fff',
          padding: '0.5rem 1.5rem',
          border: '1px solid #404040',
          borderRadius: '9999px',
          fontWeight: 'bold',
          cursor: 'pointer',
          fontSize: '0.875rem',
          transition: 'all 0.2s'
        }}
        onClick={handleLogout}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1db954'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#282828'}
        >
          Logout
        </button>
      </div>
    </header>
  );
}
