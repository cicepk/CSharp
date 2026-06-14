import { Outlet } from 'react-router-dom';
import Sidebar from '../components/common/Sidebar';
import Header from '../components/common/Header';
import Player from '../components/player/Player';
import NowPlayingPanel from '../components/NowPlayingPanel';

export default function MainLayout() {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '240px 1fr 260px',
      gridTemplateRows: '1fr 90px',
      height: '100vh',
      backgroundColor: '#121212',
      overflow: 'hidden',
    }}>
      {/* Sidebar — col 1, row 1 */}
      <div style={{
        gridColumn: '1', gridRow: '1',
        backgroundColor: '#000',
        borderRight: '1px solid #1a1a1a',
        overflowY: 'auto',
      }}>
        <Sidebar />
      </div>

      {/* Main area — col 2, row 1 */}
      <div style={{
        gridColumn: '2', gridRow: '1',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        backgroundColor: '#121212',
      }}>
        {/* Header */}
        <div style={{
          padding: '0.75rem 1.5rem',
          backgroundColor: 'rgba(18,18,18,0.95)',
          borderBottom: '1px solid #1a1a1a',
          flexShrink: 0,
        }}>
          <Header />
        </div>

        {/* Scrollable content */}
        <main style={{ flex: 1, overflowY: 'auto' }}>
          <Outlet />
        </main>
      </div>

      {/* Now Playing Panel — col 3, row 1 */}
      <div style={{ gridColumn: '3', gridRow: '1', overflow: 'hidden' }}>
        <NowPlayingPanel />
      </div>

      {/* Player bar — spans all 3 cols, row 2 */}
      <div style={{
        gridColumn: '1 / 4', gridRow: '2',
        backgroundColor: '#181818',
        borderTop: '1px solid #282828',
      }}>
        <Player />
      </div>
    </div>
  );
}
