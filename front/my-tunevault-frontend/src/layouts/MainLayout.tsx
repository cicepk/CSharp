import { Outlet } from 'react-router-dom';
import Sidebar from '../components/common/Sidebar';
import Header from '../components/common/Header';
import Player from '../components/player/Player';

export default function MainLayout() {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '250px 1fr',
      gridTemplateRows: '1fr 100px',
      height: '100vh',
      backgroundColor: '#121212',
      overflow: 'hidden'
    }}>
      {/* Sidebar - Left */}
      <div style={{ gridRow: '1 / 3', backgroundColor: '#000', borderRight: '1px solid #282828', overflowY: 'auto' }}>
        <Sidebar />
      </div>

      {/* Main Content Area - Right Top */}
      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ backgroundColor: '#181818', borderBottom: '1px solid #282828', padding: '1rem 1.5rem' }}>
          <Header />
        </div>

        {/* Scrollable Content */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
          <Outlet />
        </main>
      </div>

      {/* Player Bar - Bottom (spans both columns) */}
      <div style={{ gridColumn: '1 / 3', backgroundColor: '#181818', borderTop: '1px solid #282828' }}>
        <Player />
      </div>
    </div>
  );
}
