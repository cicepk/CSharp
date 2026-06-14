Back/
├── TuneVault.Domain/                   ← Entities & Enums (không phụ thuộc gì)
│   ├── Entities/
│   │   ├── UserProfile.cs
│   │   ├── MediaItem.cs
│   │   ├── Playlist.cs  PlaylistItem.cs
│   │   ├── Favourite.cs
│   │   ├── Follow.cs
│   │   ├── MediaShare.cs
│   │   ├── Notification.cs
│   │   ├── PlayHistory.cs
│   │   └── Genre.cs  MediaGenre.cs
│   └── Enums/
│       ├── MediaType.cs                ← Audio=1, Video=2
│       └── NotificationType.cs         ← Shared=1, Followed=2
│
├── TuneVault.Application/              ← Business logic (phụ thuộc Domain)
│   ├── DependencyInjection.cs          ← AddApplication() — đăng ký MediatR + pipeline
│   ├── Behaviours/
│   │   └── ValidationBehaviour.cs      ← FluentValidation pipeline (tự động validate)
│   ├── Interfaces/                     ← Contracts (repo + service)
│   │   ├── IUserRepository.cs
│   │   ├── IMediaItemRepository.cs
│   │   ├── IPlaylistRepository.cs
│   │   ├── IFavouriteRepository.cs
│   │   ├── IFollowRepository.cs
│   │   ├── IMediaShareRepository.cs
│   │   ├── INotificationRepository.cs
│   │   ├── IPlayHistoryRepository.cs
│   │   ├── INotificationPushService.cs ← Interface cho SignalR push
│   │   ├── IJwtService.cs
│   │   └── IDataSeeder.cs
│   ├── DTOs/                           ← Request/Response models
│   │   ├── Common/ApiResponse.cs       ← Wrapper thống nhất toàn API
│   │   ├── Auth/   Media/   Playlist/
│   │   ├── User/   Follow/  Favourite/
│   │   ├── Share/  Notification/  PlayHistory/
│   └── Features/                       ← CQRS (chỉ Share dùng MediatR)
│       └── Share/
│           ├── Commands/               ← ShareMediaCommand + Handler
│           └── Queries/                ← GetInbox/GetSent + Handlers
│
├── TuneVault.Infrastructure/           ← Data access (phụ thuộc Application)
│   ├── DependencyInjection.cs          ← AddInfrastructure() — đăng ký tất cả repos
│   ├── Data/
│   │   └── SqlConnectionFactory.cs     ← Tạo IDbConnection (Dapper)
│   ├── Database/
│   │   └── schema.sql                  ← DDL tạo 11 bảng
│   ├── Repositories/                   ← Dapper SQL queries
│   │   ├── UserRepository.cs
│   │   ├── MediaItemRepository.cs
│   │   ├── PlaylistRepository.cs
│   │   ├── FavouriteRepository.cs
│   │   ├── FollowRepository.cs
│   │   ├── MediaShareRepository.cs
│   │   ├── NotificationRepository.cs
│   │   ├── PlayHistoryRepository.cs
│   └── Services/
│       └── JwtService.cs               ← Tạo & validate JWT token
│   └── Seeders/
│       └── DataSeeder.cs               ← Seed 2 user + 10 bài nhạc mẫu
│
└── TuneVault.API/                      ← Entry point (phụ thuộc tất cả)
    ├── Program.cs                      ← DI setup, middleware pipeline, CORS, JWT
    ├── Controllers/                    ← 9 controllers
    │   ├── AuthController.cs           ← POST /login  /register
    │   ├── MediaItemsController.cs     ← GET/POST/PUT/DELETE + stream (Range)
    │   ├── PlaylistController.cs       ← CRUD + tracks + visibility
    │   ├── FavouriteController.cs      ← toggle + status
    │   ├── FollowController.cs         ← follow/unfollow + status + list
    │   ├── ShareController.cs          ← MediatR — share + inbox + sent
    │   ├── NotificationController.cs   ← list + mark read + delete
    │   ├── PlayHistoryController.cs    ← record + list
    │   └── UserController.cs           ← me + search + avatar upload
    ├── Hubs/
    │   └── NotificationHub.cs          ← SignalR Hub (Authorize)
    ├── Services/
    │   └── SignalRNotificationService.cs ← INotificationPushService impl
    ├── Middlewares/
    │   └── ExceptionHandlingMiddleware.cs ← Map exception → HTTP status
    └── wwwroot/uploads/                ← Static files
        ├── audio/   video/   covers/   avatars/