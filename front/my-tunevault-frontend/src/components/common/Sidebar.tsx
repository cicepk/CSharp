import { NavLink } from 'react-router-dom';
import styles from './Sidebar.module.css';
import homeIcon from '../../assets/icons/home.png';
import seachIcon from '../../assets/icons/search.png';
import libraryIcon from '../../assets/icons/library.png';
import sharesIcon from '../../assets/icons/share.png';
import musicNoteIcon from '../../assets/icons/music_note.png';

export default function Sidebar() {
  return (
    <aside className={styles.sidebar}>
      {/* Logo */}
      <div className={styles.logoWrap}>
        <h1 className={styles.brand}>
          <img src={musicNoteIcon} alt="TuneVault" className={styles.brandImg} /> TuneVault
        </h1>
      </div>

      {/* Navigation */}
      <nav className={styles.nav}>
        <NavLink to="/" className={({ isActive }) => (isActive ? `${styles.navLink} ${styles.active}` : `${styles.navLink} `)}>
          <img src={homeIcon} alt="Home" className={styles.icon} /> Home
        </NavLink>

        <NavLink to="/search" className={({ isActive }) => (isActive ? `${styles.navLink} ${styles.active}` : styles.navLink)}>
          <img src={seachIcon} alt="Search" className={styles.icon} /> Search
        </NavLink>

        <NavLink to="/library" className={({ isActive }) => (isActive ? `${styles.navLink} ${styles.active}` : styles.navLink)}>
          <img src={libraryIcon} alt="Library" className={styles.icon} /> Library
        </NavLink>

        <NavLink to="/share/inbox" className={({ isActive }) => (isActive ? `${styles.navLink} ${styles.active}` : styles.navLink)}>
          <img src={sharesIcon} alt="Shares" className={styles.icon} /> Share
        </NavLink>
      </nav>

      {/* Footer */}
      <div className={styles.footer}>
        <p className={styles.footerText}>© 2026 TuneVault</p>
      </div>
    </aside>
  );
}
