# 🎵 TuneVault — Nền tảng phát nhạc & xem MV trực tuyến

TuneVault là nền tảng phát nhạc và video trực tuyến lấy cảm hứng từ Spotify. Người dùng có thể tải lên, phát, tìm kiếm và chia sẻ file audio/video, tạo playlist cá nhân, theo dõi nhau và nhận thông báo real-time.

🔗 **Demo:** https://csharp-puce.vercel.app

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
| Styling | CSS Modules |
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
│   ├── TuneVault.Domain/
│   │   ├── Entities/         # UserProfile, MediaItem, Playlist, Notification, ...
│   │   └── Enums/            # MediaType, NotificationType, UserRole
│   │
│   ├── TuneVault.Application/
│   │   ├── Features/         # Auth, MediaItems, Playlist, Share, Notification,
│   │   │                     #   User, Favourite, Genre, Follow, PlayHistory, Admin
│   │   ├── Behaviours/       # ValidationBehaviour.cs
│   │   ├── DTOs/
│   │   ├── Interfaces/
│   │   └── DependencyInjection.cs
│   │
│   ├── TuneVault.Infrastructure/
│   │   ├── Data/             # SqlConnectionFactory.cs
│   │   ├── Database/         # schema.sql (tự chạy khi khởi động)
│   │   ├── Repositories/     # Dapper repositories
│   │   ├── Services/         # JwtService, PasswordHasher, FileStorageService
│   │   ├── Seeders/          # DataSeeder.cs
│   │   └── DependencyInjection.cs
│   │
│   ├── TuneVault.API/
│   │   ├── Controllers/
│   │   ├── Hubs/             # NotificationHub.cs (SignalR)
│   │   ├── Middlewares/      # ExceptionHandlingMiddleware.cs
│   │   ├── Services/         # SignalRNotificationService.cs
│   │   ├── Filters/
│   │   └── Program.cs
│   │
│   └── Dockerfile            # Multi-stage build, expose :10000
│
└── front/my-tunevault-frontend/   # React 19 + TypeScript + Vite
    └── src/
        ├── pages/
        ├── components/
        ├── contexts/          # AuthContext.tsx
        ├── hooks/             # MusicContext.tsx, useSignalRNotifications.ts
        ├── services/          # ApiService.ts
        └── types/index.ts
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
| 8 | **Chia sẻ Media** | Gửi bài/playlist cho user khác; xem inbox/sent |
| 9 | **Thông báo** | Push real-time qua SignalR; mark as read; badge đếm chưa đọc |
| 10 | **Tương tác & Lịch sử** | Like/favorite; follow user; lịch sử nghe gần đây |

---

## Yêu cầu hệ thống

Trước khi chạy project, máy cần có:

| Công cụ | Phiên bản tối thiểu | Ghi chú |
|---|---|---|
| [.NET SDK](https://dotnet.microsoft.com/download) | 10.0 | Bắt buộc cho backend |
| [Node.js](https://nodejs.org) | 20 LTS | Bắt buộc cho frontend |
| [SQL Server Express](https://www.microsoft.com/sql-server) | 2019+ | Hoặc dùng LocalDB |
| [Git](https://git-scm.com) | bất kỳ | Clone repo |
| [Docker Desktop](https://www.docker.com/products/docker-desktop) | bất kỳ | Tùy chọn — nếu chạy Docker |

Kiểm tra nhanh:
```bash
dotnet --version   # >= 10.0
node -v            # >= 20.x
npm -v
```

---

## Clone project

```bash
git clone <repository-url>
cd TuneVault
```

---

## Hướng dẫn chạy Local (không dùng Docker)

### Bước 1 — Tạo Database

Chạy lệnh sau (chỉ cần làm **một lần**):

```powershell
sqlcmd -S ".\SQLEXPRESS" -Q "CREATE DATABASE TuneVaultDb;"
```

>  Schema và seed data được tự động tạo khi backend khởi động lần đầu (`DataSeeder.cs`) — không cần chạy script SQL thủ công.

### Bước 2 — Cấu hình Connection String

Mở file `Back/TuneVault.Api/appsettings.json` và cập nhật connection string:

**SQL Server Express (mặc định):**
```json
"ConnectionStrings": {
  "DefaultConnection": "Server=.\\SQLEXPRESS;Database=TuneVaultDb;Integrated Security=true;TrustServerCertificate=True;Connect Timeout=30;"
}
```

**SQL Server LocalDB (nếu không dùng SQLEXPRESS):**
```json
"ConnectionStrings": {
  "DefaultConnection": "Server=(localdb)\\MSSQLLocalDB;Database=TuneVaultDb;Integrated Security=true;TrustServerCertificate=True;"
}
```

### Bước 3 — Cấu hình JWT & Storage (tùy chọn)

Trong `appsettings.json`, đảm bảo phần `Jwt` và `Supabase` đã được điền (hoặc dùng `LocalFileStorageService` cho môi trường dev):

```json
"Jwt": {
  "Key": "your-secret-key-at-least-32-characters",
  "Issuer": "TuneVault",
  "Audience": "TuneVaultUsers",
  "ExpiresInMinutes": 1440
},
"Storage": {
  "UseLocal": true
}
```

### Bước 4 — Chạy Backend

```bash
cd Back/TuneVault.API
dotnet restore
dotnet run
```

Backend khởi động tại:
- API: `http://localhost:5067`
- Swagger UI: `http://localhost:5067/swagger`

### Bước 5 — Cấu hình Frontend

Tạo file `front/my-tunevault-frontend/.env.local`:

```env
VITE_API_BASE_URL=http://localhost:5067
```

### Bước 6 — Chạy Frontend

```bash
cd front/my-tunevault-frontend
npm install
npm run dev
```

Frontend khởi động tại: `http://localhost:5173`

---

## Chạy nhanh toàn bộ project (Docker)

```bash
docker compose up -d --build
```

> Lần chạy đầu tiên mất vài phút để pull ảnh SQL Server, .NET, Node.js.

| Service | URL |
|---|---|
| Frontend | `http://localhost:3000` |
| Backend (API + Swagger) | `http://localhost:5067/swagger` |

---

## Tài khoản seed

Sau khi backend khởi động, các tài khoản sau được tạo tự động:

| Username | Email | Mật khẩu | Vai trò |
|---|---|---|---|
| `admin` | admin@tunevault.com | `Password123` | Admin |
| `john_music` | john@tunevault.com | `Password123` | User |

**Dữ liệu seed sẵn có:** 10 bài audio, 3 video, 8 thể loại nhạc, 2 playlist, favorites, follows, shares và notifications mẫu.

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
| POST | `/api/follow` | Follow user | ✓ |
| GET | `/api/genre` | Danh sách thể loại | — |
| GET | `/api/playhistory` | Lịch sử nghe | ✓ |
| POST | `/api/playhistory` | Ghi nhận lượt phát | ✓ |

---

## Tài liệu & Thư viện sử dụng

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
| @microsoft/signalr | SignalR JS client | https://www.npmjs.com/package/@microsoft/signalr |
| Jason Taylor Clean Architecture | Tham khảo cấu trúc | https://github.com/jasontaylordev/CleanArchitecture |
