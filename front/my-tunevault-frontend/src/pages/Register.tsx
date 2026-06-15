import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !email || !password || !confirmPassword) {
      setError('All fields are required');
      return;
    }

    if (username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (!/[A-Z]/.test(password)) {
      setError('Password must contain uppercase letter');
      return;
    }

    if (!/[0-9]/.test(password)) {
      setError('Password must contain number');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      await register(username, email, password);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#121212',
      padding: '2rem'
    }}>
      <div style={{
        backgroundColor: '#282828',
        padding: '2rem',
        borderRadius: '8px',
        width: '100%',
        maxWidth: '400px'
      }}>
        <h1 style={{
          fontSize: '2rem',
          fontWeight: 'bold',
          marginBottom: '1rem',
          color: '#1db954',
          textAlign: 'center'
        }}>
          🎵 TuneVault
        </h1>

        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: 'bold',
          marginBottom: '1.5rem',
          color: '#fff',
          textAlign: 'center'
        }}>
          Create Account
        </h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: '#b3b3b3',
              fontSize: '0.875rem'
            }}>
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="your_username"
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: '#181818',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                fontSize: '1rem',
                boxSizing: 'border-box',
                outline: 'none'
              }}
              onFocus={(e) => e.currentTarget.style.backgroundColor = '#1a1a1a'}
              onBlur={(e) => e.currentTarget.style.backgroundColor = '#181818'}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: '#b3b3b3',
              fontSize: '0.875rem'
            }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: '#181818',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                fontSize: '1rem',
                boxSizing: 'border-box',
                outline: 'none'
              }}
              onFocus={(e) => e.currentTarget.style.backgroundColor = '#1a1a1a'}
              onBlur={(e) => e.currentTarget.style.backgroundColor = '#181818'}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: '#b3b3b3',
              fontSize: '0.875rem'
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: '#181818',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                fontSize: '1rem',
                boxSizing: 'border-box',
                outline: 'none'
              }}
              onFocus={(e) => e.currentTarget.style.backgroundColor = '#1a1a1a'}
              onBlur={(e) => e.currentTarget.style.backgroundColor = '#181818'}
            />
            <p style={{
              fontSize: '0.75rem',
              color: '#b3b3b3',
              marginTop: '0.25rem'
            }}>
              Min 8 chars, 1 uppercase, 1 number
            </p>
          </div>

          <div>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: '#b3b3b3',
              fontSize: '0.875rem'
            }}>
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: '#181818',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                fontSize: '1rem',
                boxSizing: 'border-box',
                outline: 'none'
              }}
              onFocus={(e) => e.currentTarget.style.backgroundColor = '#1a1a1a'}
              onBlur={(e) => e.currentTarget.style.backgroundColor = '#181818'}
            />
          </div>

          {error && (
            <div style={{
              backgroundColor: '#dc2626',
              color: '#fff',
              padding: '0.75rem',
              borderRadius: '4px',
              fontSize: '0.875rem'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            style={{
              backgroundColor: '#1db954',
              color: '#000',
              padding: '0.75rem',
              border: 'none',
              borderRadius: '9999px',
              fontWeight: 'bold',
              fontSize: '1rem',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.6 : 1,
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => {
              if (!isLoading) e.currentTarget.style.backgroundColor = '#1ed760';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#1db954';
            }}
          >
            {isLoading ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <p style={{
          marginTop: '1.5rem',
          textAlign: 'center',
          color: '#b3b3b3',
          fontSize: '0.875rem'
        }}>
          Already have an account?{' '}
          <Link
            to="/login"
            style={{
              color: '#1db954',
              textDecoration: 'none',
              fontWeight: 'bold'
            }}
          >
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}
