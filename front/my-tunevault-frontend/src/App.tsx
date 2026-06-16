import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
import Search from './pages/Search';
import Library from './pages/Library.tsx';
import Playlist from './pages/Playlist.tsx';
import Artist from './pages/Artist';
import CollectionPage from './pages/Collection.tsx';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import VideoPlayer from './pages/VideoPlayer';
import Login from './pages/Login';
import Register from './pages/Register';
import ProtectedRoute from './components/ProtectedRoute';
import { MusicProvider } from './hooks/MusicContext';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <AuthProvider>
      <MusicProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<Home />} />
              <Route path="/search" element={<Search />} />
              <Route path="/library" element={<Library />} />
              <Route path="/collection/:id" element={<CollectionPage />} />
              <Route path="/playlist/:id" element={<Playlist />} />
              <Route path="/artist/:id" element={<Artist />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/video/:id" element={<VideoPlayer />} />
            </Route>
          </Routes>
        </Router>
      </MusicProvider>
    </AuthProvider>
  );
}

export default App;
