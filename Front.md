src/
├── main.tsx                            ← Vite entry point
├── App.tsx                             ← Router + AuthProvider + MusicProvider
├── index.css
│
├── types/index.ts                      ← Song, Playlist, User, NotificationItem, ...
│
├── contexts/
│   └── AuthContext.tsx                 ← user, token, login/logout, refreshUser
│
├── hooks/
│   ├── MusicContext.tsx                ← queue, currentSong, play/pause, history
│   └── useSignalRNotifications.ts      ← Kết nối SignalR, nhận ReceiveNotification
│
├── services/
│   └── ApiService.ts                   ← Toàn bộ HTTP calls (singleton)
│
├── layouts/
│   └── MainLayout.tsx                  ← Sidebar + Header + Outlet + Player
│
├── components/
│   ├── common/
│   │   ├── Header.tsx                  ← Upload btn, notification bell, profile menu
│   │   └── Sidebar.tsx                 ← Nav links
│   ├── player/
│   │   └── Player.tsx                  ← Thanh player dưới (play/pause/next/volume)
│   ├── ShareModal.tsx                  ← Modal chia sẻ nhạc/playlist → search user
│   ├── UploadModal.tsx                 ← Drag&drop upload audio/video + cover
│   └── NowPlayingPanel.tsx
│
├── pages/
│   ├── Login.tsx   Register.tsx        ← Auth pages
│   ├── Home.tsx                        ← Grid bài hát, nút Share
│   ├── Search.tsx                      ← Tìm song + user, Follow inline
│   ├── Library.tsx                     ← Playlist list, public/private toggle
│   ├── Playlist.tsx                    ← Chi tiết playlist, track list, Share/Remove
│   ├── Profile.tsx                     ← Profile cá nhân, edit, avatar upload
│   └── Artist.tsx                      ← Profile user khác, Follow, public playlists
│
└── assets/icons/                       ← PNG icons (play, pause, next, ...)