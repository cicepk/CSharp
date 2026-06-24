# TuneVault — Media Streaming Web Application

TuneVault là nền tảng phát nhạc và video trực tuyến lấy cảm hứng từ Spotify. Người dùng có thể tải lên, phát, tìm kiếm và chia sẻ file audio/video, tạo playlist cá nhân, theo dõi nhau và nhận thông báo real-time.

---

## Công nghệ sử dụng

### Backend
| Thành phần | Công nghệ |
|---|---|
| Framework | ASP.NET Core 10 Web API |
| ORM / Data Access | Dapper 2.1 + Microsoft.Data.SqlClient 7 |
| Cơ sở dữ liệu | SQL Server (LocalDB / SQLEXPRESS) |
| Xác thực | JWT Bearer (`Microsoft.AspNetCore.Authentication.JwtBearer`) |
| Pipeline / CQRS | MediatR 14 + `IPipelineBehavior` |
| Validation | FluentValidation 12 |
| Real-time | ASP.NET Core SignalR |
| Password hashing | BCrypt.Net-Next 4.2 |
| Tài liệu API | Swagger / OpenAPI (`Swashbuckle.AspNetCore`) |

### Frontend
| Thành phần | Công nghệ |
|---|---|
| Framework | React 19 + TypeScript 6 |
| Build tool | Vite 8 |
| Routing | React Router DOM 7 |
| Styling | Tailwind CSS 4 |
| Real-time client | `@microsoft/signalr` 10 |

### Cloud & DevOps
| Thành phần | Dịch vụ |
|---|---|
| Backend hosting | [Render](https://render.com) (Docker deployment) |
| Frontend hosting | [Vercel](https://vercel.com) |
| File storage | [Supabase Storage](https://supabase.com) |
| CI/CD | GitHub Actions |

---

## Kiến trúc hệ thống

```
React SPA (Vercel)
        │  HTTP / REST API
        ▼
ASP.NET Core API  ──SignalR──▶  Browser (real-time notifications)
        │
        ├── Application Layer  (MediatR, Handlers, Validators)
        ├── Domain Layer        (Entities, Interfaces, Enums)
        └── Infrastructure Layer (Dapper, SQL Server, Supabase Storage)
```

**Quy tắc phụ thuộc (Dependency Rule):**
- `Domain` — không phụ thuộc layer nào.
- `Application` — chỉ phụ thuộc `Domain`.
- `Infrastructure` — implement interface từ `Application`/`Domain`.
- `API` — chỉ gọi `Application` qua MediatR; Controller không gọi trực tiếp Dapper/SQL.

---

## Cấu trúc project (Clean Architecture)

```
TuneVault/
├── Back/
│   ├── TuneVault.Domain/                   # Layer trong cùng — không phụ thuộc ai
│   │   ├── Entities/                       # UserProfile, MediaItem, Playlist, MediaShare,
│   │   │   │                               #   Notification, Favourite, Follow, PlayHistory,
│   │   │   │                               #   Genre, MediaGenre, PlaylistItem
│   │   └── Enums/                          # MediaType, NotificationType, UserRole
│   │
│   ├── TuneVault.Application/              # Use Cases — chỉ phụ thuộc Domain
│   │   ├── Features/                       # Mỗi feature = Commands + Queries + Validators
│   │   │   ├── Auth/Commands/              # Register, Login, ChangePassword
│   │   │   ├── MediaItems/
│   │   │   │   ├── Commands/               # Upload, Update, Delete
│   │   │   │   └── Queries/                # GetAll, GetById, GetMyUploads, Search,
│   │   │   │                               #   GetRecommendations, GetMediaFilePath
│   │   │   ├── Playlist/
│   │   │   │   ├── Commands/               # Create, Update, Delete, AddTrack,
│   │   │   │   │                           #   RemoveTrack, ToggleVisibility
│   │   │   │   └── Queries/                # GetMyPlaylists, GetById, GetPublicByUser
│   │   │   ├── Share/
│   │   │   │   ├── Commands/               # ShareMedia, DeleteShare
│   │   │   │   └── Queries/                # GetShareInbox, GetShareSent
│   │   │   ├── Notification/
│   │   │   │   ├── Commands/               # MarkAsRead, MarkAllAsRead, DeleteNotification
│   │   │   │   └── Queries/                # GetNotifications, GetUnreadCount
│   │   │   ├── User/
│   │   │   │   ├── Commands/               # UpdateProfile, UploadAvatar
│   │   │   │   └── Queries/                # GetCurrentUser, GetUserById, SearchUsers
│   │   │   ├── Favourite/Commands+Queries/ # ToggleFavourite, GetFavourites, GetStatus
│   │   │   ├── Follow/Commands+Queries/    # Follow, Unfollow, GetFollowers, GetFollowing
│   │   │   ├── PlayHistory/                # RecordPlay, GetPlayHistory
│   │   │   └── Admin/Commands+Queries/     # Stats, Users, DeleteUser/Track
│   │   ├── Behaviours/
│   │   │   └── ValidationBehaviour.cs      # Pipeline: validate trước mọi handler
│   │   ├── DTOs/                           # Request/Response DTOs theo từng feature
│   │   ├── Interfaces/                     # IUserRepository, IMediaItemRepository,
│   │   │                                   #   IFileStorageService, IJwtService, ...
│   │   └── DependencyInjection.cs
│   │
│   ├── TuneVault.Infrastructure/           # Implement interfaces từ Application
│   │   ├── Data/
│   │   │   └── SqlConnectionFactory.cs     # Tạo IDbConnection cho Dapper
│   │   ├── Database/
│   │   │   └── schema.sql                  # Toàn bộ DDL — tự chạy khi khởi động
│   │   ├── Repositories/                   # Dapper: UserRepo, MediaItemRepo,
│   │   │                                   #   PlaylistRepo, ShareRepo, NotificationRepo,
│   │   │                                   #   FavouriteRepo, FollowRepo, PlayHistoryRepo
│   │   ├── Services/
│   │   │   ├── JwtService.cs               # Tạo / validate JWT
│   │   │   ├── PasswordHasher.cs           # BCrypt wrapper
│   │   │   ├── LocalFileStorageService.cs  # Lưu file vào wwwroot/music (dev)
│   │   │   └── SupabaseFileStorageService.cs # Upload lên Supabase Storage (prod)
│   │   ├── Seeders/
│   │   │   └── DataSeeder.cs               # Tự tạo schema + seed 2 users, 13 media,
│   │   │                                   #   2 playlists, genres khi DB trống
│   │   └── DependencyInjection.cs
│   │
│   ├── TuneVault.API/                      # Presentation — chỉ gọi Application qua MediatR
│   │   ├── Controllers/                    # AuthController, MediaItemsController,
│   │   │                                   #   PlaylistController, ShareController,
│   │   │                                   #   NotificationController, UserController,
│   │   │                                   #   FavouriteController, FollowController,
│   │   │                                   #   GenreController, PlayHistoryController,
│   │   │                                   #   AdminController
│   │   ├── Hubs/
│   │   │   └── NotificationHub.cs          # SignalR hub — push real-time notifications
│   │   ├── Middlewares/
│   │   │   └── ExceptionHandlingMiddleware.cs
│   │   ├── Services/
│   │   │   └── SignalRNotificationService.cs # INotificationPushService → SignalR
│   │   ├── Filters/
│   │   │   └── AuthorizeOperationFilter.cs # Thêm lock vào Swagger cho endpoint có [Authorize]
│   │   └── Program.cs
│   │
│   └── Dockerfile                          # Multi-stage build, expose :10000
│
├── front/my-tunevault-frontend/            # React 19 + TypeScript + Vite
│   └── src/
│       ├── pages/                          # Login, Register, Home, Search, Library,
│       │                                   #   Playlist, ShareInbox, Notifications,
│       │                                   #   Profile, Artist, VideoPlayer, AdminPanel
│       ├── components/
│       │   ├── common/                     # Sidebar, Header, RightSidebar
│       │   ├── player/                     # Player bar, SongDetails
│       │   ├── ShareModal.tsx              # Modal chia sẻ media
│       │   └── UploadModal.tsx             # Modal upload file
│       ├── contexts/
│       │   └── AuthContext.tsx             # JWT + user state toàn app
│       ├── hooks/
│       │   ├── MusicContext.tsx            # Player state (track đang phát, queue)
│       │   └── useSignalRNotifications.ts  # Kết nối SignalR, nhận notification
│       ├── services/
│       │   └── ApiService.ts               # Axios wrapper — toàn bộ API calls
│       └── types/index.ts                  # TypeScript interfaces khớp DTO backend
│
├── docker-compose.yml                      # SQL Server 2022 Express container
├── render.yaml                             # Render deploy config (branch: main)
└── .github/workflows/ci.yml               # GitHub Actions: build .NET + React
```

---

## 10 chức năng chính

| # | Chức năng | Mô tả |
|---|---|---|
| 1 | **Xác thực** | Đăng ký, đăng nhập; trả JWT; bảo vệ route |
| 2 | **Hồ sơ người dùng** | Xem/sửa profile, upload avatar |
| 3 | **Thư viện Media** | Upload audio (mp3/wav) và video (mp4/webm); xem danh sách |
| 4 | **Audio Player** | Phát nhạc, pause, seek; player bar cố định; lưu play history |
| 5 | **Video Player** | Phát video full-page; hỗ trợ Range requests |
| 6 | **Playlist** | CRUD playlist; thêm/xóa track; public/private |
| 7 | **Tìm kiếm & Khám phá** | Tìm theo tên bài, nghệ sĩ; AI recommendations |
| 8 | **Chia sẻ Media**  | Gửi bài/playlist cho user khác; xem inbox/sent |
| 9 | **Thông báo**  | Push real-time qua SignalR; mark as read; badge đếm chưa đọc |
| 10 | **Tương tác & Lịch sử** | Like/favorite; follow user; lịch sử nghe gần đây |

### Tài khoản seed

| Username | Email | Password | Role |
|---|---|---|---|
| `admin` | admin@tunevault.com | `Password123` | Admin |
| `john_music` | john@tunevault.com | `Password123` | User |

**Dữ liệu seed sẵn:** 10 bài audio, 3 video, 8 thể loại, 2 playlist, favorites, follows, shares và notifications mẫu.

---

## API Endpoints

### Auth — `/api/auth`
| Method | Endpoint | Mô tả | Auth |
|---|---|---|---|
| POST | `/register` | Đăng ký tài khoản | — |
| POST | `/login` | Đăng nhập, trả JWT | — |

### Media Items — `/api/mediaitems`
| Method | Endpoint | Mô tả | Auth |
|---|---|---|---|
| GET | `/` | Danh sách tất cả media | — |
| GET | `/my-uploads` | Media của user đang đăng nhập | ✓ |
| GET | `/recommendations` | Gợi ý bài hát (AI) | ✓ |
| GET | `/{id}` | Chi tiết một media item | — |
| POST | `/upload` | Upload file audio/video | ✓ |
| GET | `/{id}/stream` | Stream audio/video (hỗ trợ Range) | — |
| GET | `/search?q=` | Tìm kiếm theo tên, nghệ sĩ | — |

### Playlist — `/api/playlist`
| Method | Endpoint | Mô tả | Auth |
|---|---|---|---|
| GET | `/` | Danh sách playlist của user | ✓ |
| GET | `/{id}` | Chi tiết playlist | ✓ |
| POST | `/` | Tạo playlist mới | ✓ |
| POST | `/{id}/tracks` | Thêm track vào playlist | ✓ |
| GET | `/user/{userId}/public` | Playlist public của user | — |

### Share — `/api/share`
| Method | Endpoint | Mô tả | Auth |
|---|---|---|---|
| POST | `/` | Chia sẻ media cho user khác | ✓ |
| GET | `/inbox` | Danh sách media được chia sẻ cho mình | ✓ |
| GET | `/sent` | Danh sách media mình đã chia sẻ | ✓ |

### Notification — `/api/notification`
| Method | Endpoint | Mô tả | Auth |
|---|---|---|---|
| GET | `/` | Danh sách thông báo | ✓ |
| GET | `/unread-count` | Số thông báo chưa đọc | ✓ |

### User — `/api/user`
| Method | Endpoint | Mô tả | Auth |
|---|---|---|---|
| GET | `/me` | Profile của user hiện tại | ✓ |
| GET | `/{id}` | Profile theo ID | — |
| GET | `/search?q=` | Tìm kiếm user | — |
| POST | `/me/avatar` | Upload avatar | ✓ |

### Các endpoint khác
| Method | Endpoint | Mô tả | Auth |
|---|---|---|---|
| GET | `/api/favourite` | Danh sách bài yêu thích | ✓ |
| POST | `/api/follow` | Follow / Unfollow user | ✓ |
| GET | `/api/genre` | Danh sách thể loại | — |
| GET | `/api/playhistory` | Lịch sử nghe | ✓ |
| POST | `/api/playhistory` | Ghi nhận lượt phát | ✓ |

---

## Tài liệu & Trích dẫn nguồn mở

| Thư viện / Tài nguyên | Mục đích | Nguồn |
|---|---|---|
| ASP.NET Core | Web API framework | https://learn.microsoft.com/aspnet/core |
| Dapper | Micro-ORM cho SQL Server | https://github.com/DapperLib/Dapper |
| MediatR | CQRS / Pipeline pattern | https://github.com/jbogard/MediatR |
| FluentValidation | Validation pipeline behavior | https://docs.fluentvalidation.net |
| BCrypt.Net-Next | Password hashing | https://github.com/BcryptNet/bcrypt.net |
| Swashbuckle.AspNetCore | Swagger / OpenAPI | https://github.com/domaindrivendev/Swashbuckle.AspNetCore |
| Microsoft.AspNetCore.SignalR | Real-time notifications | https://learn.microsoft.com/aspnet/core/signalr |
| React | Frontend UI library | https://react.dev |
| Vite | Frontend build tool | https://vitejs.dev |
| React Router DOM | SPA routing | https://reactrouter.com |
| Tailwind CSS | Utility-first CSS framework | https://tailwindcss.com |
| @microsoft/signalr | SignalR JS client | https://www.npmjs.com/package/@microsoft/signalr |
| Jason Taylor Clean Architecture template | Tham khảo cấu trúc Clean Architecture | https://github.com/jasontaylordev/CleanArchitecture |
