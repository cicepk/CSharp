import { Outlet } from 'react-router-dom';
import Sidebar from '../components/common/Sidebar';
import Header from '../components/common/Header';
import Player from '../components/player/Player';
import NowPlayingPanel from '../components/NowPlayingPanel';
import styles from './MainLayout.module.css';

export default function MainLayout() {
  return (
    <div className={styles.layout}>
      {/* Sidebar — col 1, row 1 */}
      <div className={styles.sidebar}>
        <Sidebar />
      </div>

      {/* Main area — col 2, row 1 */}
      <div className={styles.mainArea}>
        {/* Header */}
        <div className={styles.headerBar}>
          <Header />
        </div>

        {/* Scrollable content */}
        <main className={styles.mainContent}>
          <Outlet />
        </main>
      </div>

      {/* Now Playing Panel — col 3, row 1 */}
      <div className={styles.nowPlayingPanel}>
        <NowPlayingPanel />
      </div>

      {/* Player bar — spans all 3 cols, row 2 */}
      <div className={styles.playerBar}>
        <Player />
      </div>
    </div>
  );
}
