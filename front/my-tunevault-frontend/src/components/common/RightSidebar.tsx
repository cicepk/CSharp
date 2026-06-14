import SongDetails from '../player/SongDetails';

export default function RightSidebar() {
  return (
    <aside style={{
      height: '100%',
      overflowY: 'auto',
      backgroundColor: '#000'
    }}>
      <SongDetails />
    </aside>
  );
}
