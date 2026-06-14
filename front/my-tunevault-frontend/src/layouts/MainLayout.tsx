import { Outlet } from 'react-router-dom';
import Sidebar from '../components/common/Sidebar';
import Header from '../components/common/Header';
import Player from '../components/player/Player';
import RightSidebar from '../components/common/RightSidebar';

export default function MainLayout() {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '250px minmax(0, 1fr) 360px',
      gridTemplateRows: '1fr 100px',
      height: '100vh',
      backgroundColor: '#121212',
      overflow: 'hidden'
    }}>
      {/* Sidebar - Left */}
      <div style={{ gridRow: '1 / 3', gridColumn: '1 / 2', backgroundColor: '#000', borderRight: '1px solid #282828', overflowY: 'auto' }}>
        <Sidebar />
      </div>

      {/* Main Content Area - Center */}
      <div style={{ gridColumn: '2 / 3', gridRow: '1 / 2', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ backgroundColor: '#181818', borderBottom: '1px solid #282828', padding: '1rem 1.5rem' }}>
          <Header />
        </div>

        {/* Scrollable Content */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto', width: '100%' }}>
            <Outlet />
          </div>
        </main>
      </div>

      {/* Right Sidebar - Song details (fixed width) */}
      <div style={{ gridRow: '1 / 2', gridColumn: '3 / 4', borderLeft: '1px solid #282828', overflowY: 'auto', minWidth: '260px' }}>
        <RightSidebar />
      </div>

      {/* Player Bar - Bottom (spans all columns) */}
      <div style={{ gridColumn: '1 / 4', backgroundColor: '#181818', borderTop: '1px solid #282828' }}>
        <Player />
      </div>
    </div>
  );
}
