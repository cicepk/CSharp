using Dapper;
using System.Data;
using TuneVault.Infrastructure.Data;

namespace TuneVault.Infrastructure.Seeders;

/// Implementation seeder với Dapper
public class DataSeeder : IDataSeeder
{
    private readonly ISqlConnectionFactory _connectionFactory;

    public DataSeeder(ISqlConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    /// Kiểm tra xem database đã có data chưa
    public async Task<bool> IsSeededAsync()
    {
        const string sql = "SELECT COUNT(*) FROM UserProfiles";

        using (var connection = _connectionFactory.CreateConnection())
        {
            var command = new CommandDefinition(sql);
            var count = await connection.ExecuteScalarAsync<int>(command);
            
            // Nếu đã có ≥ 1 user → database đã được seed
            return count > 0;
        }
    }

    /// Thực hiện seeding tất cả dữ liệu
    public async Task SeedAsync()
    {
        // Kiểm tra database đã seed chưa
        if (await IsSeededAsync())
        {
            Console.WriteLine(" Database đã được seed trước đó, bỏ qua seeding.");
            return;
        }

        Console.WriteLine(" Bắt đầu seed dữ liệu vào database...");

        try
        {
            using (var connection = _connectionFactory.CreateConnection())
            {
                connection.Open();

                // Tạo transaction - nếu bất kỳ insert nào fail → rollback tất cả
                using (var transaction = connection.BeginTransaction())
                {
                    try
                    {
                        // Seed users
                        await SeedUsersAsync(connection, transaction);
                        Console.WriteLine(" Seed 2 users thành công");

                        // Seed media items
                        await SeedMediaItemsAsync(connection, transaction);
                        Console.WriteLine(" Seed 10 media items (6 audio + 4 video) thành công");

                        // Seed playlists
                        await SeedPlaylistsAsync(connection, transaction);
                        Console.WriteLine(" Seed 2 playlists thành công");

                        // Seed playlist items
                        await SeedPlaylistItemsAsync(connection, transaction);
                        Console.WriteLine(" Seed playlist items thành công");

                        // Seed favorites
                        await SeedFavouritesAsync(connection, transaction);
                        Console.WriteLine(" Seed favorites thành công");

                        // Seed follows
                        await SeedFollowsAsync(connection, transaction);
                        Console.WriteLine(" Seed relationships thành công");

                        // Seed media shares
                        await SeedMediaSharesAsync(connection, transaction);
                        Console.WriteLine(" Seed shares thành công");

                        // Seed notifications
                        await SeedNotificationsAsync(connection, transaction);
                        Console.WriteLine(" Seed notifications thành công");

                        // Commit transaction - lưu tất cả changes
                        transaction.Commit();
                        Console.WriteLine("\n Seed dữ liệu hoàn tất thành công!");
                    }
                    catch (Exception ex)
                    {
                        // Nếu có lỗi → rollback transaction
                        transaction.Rollback();
                        Console.WriteLine($"\n Lỗi seed dữ liệu: {ex.Message}");
                        throw;
                    }
                }
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"\n Lỗi kết nối database: {ex.Message}");
            throw;
        }
    }

    /// Seed 2 users
    private async Task SeedUsersAsync(IDbConnection connection, IDbTransaction transaction)
    {
        const string sql = @"
            INSERT INTO UserProfiles (Id, UserName, Email, CreatedAt)
            VALUES (@Id, @UserName, @Email, @CreatedAt)";

        // Tạo list users
        var users = new List<(Guid id, string userName, string email, DateTime createdAt)>
        {
            // User 1: Admin
            (
                new Guid("550e8400-e29b-41d4-a716-446655440001"),
                "admin",
                "admin@tunevault.com",
                new DateTime(2026, 1, 1, 10, 0, 0)
            ),
            // User 2: Regular user
            (
                new Guid("550e8400-e29b-41d4-a716-446655440002"),
                "john_music",
                "john@tunevault.com",
                new DateTime(2026, 1, 5, 14, 30, 0)
            )
        };

        // Insert từng user
        foreach (var user in users)
        {
            var parameters = new
            {
                Id = user.id,
                UserName = user.userName,
                Email = user.email,
                CreatedAt = user.createdAt
            };

            var command = new CommandDefinition(sql, parameters, transaction: transaction);
            await connection.ExecuteAsync(command);
        }
    }

    /// 6 audio items + 4 video items
    private async Task SeedMediaItemsAsync(IDbConnection connection, IDbTransaction transaction)
    {
        const string sql = @"
            INSERT INTO MediaItems (Id, Title, Artist, FilePath, MediaType, DurationSeconds, CreatedAt, OwnerId)
            VALUES (@Id, @Title, @Artist, @FilePath, @MediaType, @DurationSeconds, @CreatedAt, @OwnerId)";

        // Admin user ID
        var adminId = new Guid("550e8400-e29b-41d4-a716-446655440001");

        // Tạo list media items
        var mediaItems = new List<dynamic>
        {
            // ===== AUDIO ITEMS (MediaType = 0) =====
            new
            {
                Id = new Guid("660e8400-e29b-41d4-a716-446655440001"),
                Title = "Blinding Lights",
                Artist = "The Weeknd",
                FilePath = "/music/audio/blinding-lights.mp3",
                MediaType = 0,  // Audio
                DurationSeconds = 200,
                CreatedAt = new DateTime(2026, 1, 10, 8, 0, 0),
                OwnerId = adminId
            },
            new
            {
                Id = new Guid("660e8400-e29b-41d4-a716-446655440002"),
                Title = "Shape of You",
                Artist = "Ed Sheeran",
                FilePath = "/music/audio/shape-of-you.mp3",
                MediaType = 0,
                DurationSeconds = 234,
                CreatedAt = new DateTime(2026, 1, 11, 9, 30, 0),
                OwnerId = adminId
            },
            new
            {
                Id = new Guid("660e8400-e29b-41d4-a716-446655440003"),
                Title = "Uptown Funk",
                Artist = "Mark Ronson ft. Bruno Mars",
                FilePath = "/music/audio/uptown-funk.mp3",
                MediaType = 0,
                DurationSeconds = 269,
                CreatedAt = new DateTime(2026, 1, 12, 10, 15, 0),
                OwnerId = adminId
            },
            new
            {
                Id = new Guid("660e8400-e29b-41d4-a716-446655440004"),
                Title = "Perfect",
                Artist = "Ed Sheeran",
                FilePath = "/music/audio/perfect.mp3",
                MediaType = 0,
                DurationSeconds = 263,
                CreatedAt = new DateTime(2026, 1, 13, 11, 0, 0),
                OwnerId = adminId
            },
            new
            {
                Id = new Guid("660e8400-e29b-41d4-a716-446655440005"),
                Title = "Bohemian Rhapsody",
                Artist = "Queen",
                FilePath = "/music/audio/bohemian-rhapsody.mp3",
                MediaType = 0,
                DurationSeconds = 354,
                CreatedAt = new DateTime(2026, 1, 14, 12, 30, 0),
                OwnerId = adminId
            },
            new
            {
                Id = new Guid("660e8400-e29b-41d4-a716-446655440006"),
                Title = "Hotel California",
                Artist = "Eagles",
                FilePath = "/music/audio/hotel-california.mp3",
                MediaType = 0,
                DurationSeconds = 391,
                CreatedAt = new DateTime(2026, 1, 15, 13, 45, 0),
                OwnerId = adminId
            },

            // ===== VIDEO ITEMS (MediaType = 1) =====
            new
            {
                Id = new Guid("660e8400-e29b-41d4-a716-446655440007"),
                Title = "Levitating - Official Music Video",
                Artist = "Dua Lipa",
                FilePath = "/music/video/levitating-mv.mp4",
                MediaType = 1,  // Video
                DurationSeconds = 203,
                CreatedAt = new DateTime(2026, 1, 16, 14, 0, 0),
                OwnerId = adminId
            },
            new
            {
                Id = new Guid("660e8400-e29b-41d4-a716-446655440008"),
                Title = "As It Was - Live Performance",
                Artist = "Harry Styles",
                FilePath = "/music/video/as-it-was-live.mp4",
                MediaType = 1,
                DurationSeconds = 180,
                CreatedAt = new DateTime(2026, 1, 17, 15, 20, 0),
                OwnerId = adminId
            },
            new
            {
                Id = new Guid("660e8400-e29b-41d4-a716-446655440009"),
                Title = "Setlist Concert 2025",
                Artist = "Taylor Swift",
                FilePath = "/music/video/taylor-concert-2025.mp4",
                MediaType = 1,
                DurationSeconds = 5400,
                CreatedAt = new DateTime(2026, 1, 18, 16, 30, 0),
                OwnerId = adminId
            },
            new
            {
                Id = new Guid("660e8400-e29b-41d4-a716-446655440010"),
                Title = "Making Of Album - Behind The Scenes",
                Artist = "The Weeknd",
                FilePath = "/music/video/weeknd-bts.mp4",
                MediaType = 1,
                DurationSeconds = 720,
                CreatedAt = new DateTime(2026, 1, 19, 17, 15, 0),
                OwnerId = adminId
            }
        };

        // Insert từng media item
        foreach (var item in mediaItems)
        {
            var command = new CommandDefinition(sql, item, transaction: transaction);
            await connection.ExecuteAsync(command);
        }
    }

    /// Seed 2 playlists
    private async Task SeedPlaylistsAsync(IDbConnection connection, IDbTransaction transaction)
    {
        const string sql = @"
            INSERT INTO Playlists (Id, Name, IsPublic, CreatedAt, OwnerId)
            VALUES (@Id, @Name, @IsPublic, @CreatedAt, @OwnerId)";

        var adminId = new Guid("550e8400-e29b-41d4-a716-446655440001");

        var playlists = new List<dynamic>
        {
            // Playlist 1: Public
            new
            {
                Id = new Guid("770e8400-e29b-41d4-a716-446655440001"),
                Name = "Pop Hits 2025",
                IsPublic = 1,
                CreatedAt = new DateTime(2026, 1, 20, 8, 0, 0),
                OwnerId = adminId
            },
            // Playlist 2: Private
            new
            {
                Id = new Guid("770e8400-e29b-41d4-a716-446655440002"),
                Name = "Chill & Relax",
                IsPublic = 0,
                CreatedAt = new DateTime(2026, 1, 21, 9, 30, 0),
                OwnerId = adminId
            }
        };

        foreach (var playlist in playlists)
        {
            var command = new CommandDefinition(sql, playlist, transaction: transaction);
            await connection.ExecuteAsync(command);
        }
    }

    /// Seed playlist items - Thêm media items vào playlists
    private async Task SeedPlaylistItemsAsync(IDbConnection connection, IDbTransaction transaction)
    {
        const string sql = @"
            INSERT INTO PlaylistItems (PlaylistId, MediaItemId, AddedAt)
            VALUES (@PlaylistId, @MediaItemId, @AddedAt)";

        var playlist1 = new Guid("770e8400-e29b-41d4-a716-446655440001");
        var playlist2 = new Guid("770e8400-e29b-41d4-a716-446655440002");

        var playlistItems = new List<(Guid playlistId, Guid mediaItemId, DateTime addedAt)>
        {
            // Playlist 1: Pop Hits
            (playlist1, new Guid("660e8400-e29b-41d4-a716-446655440001"), new DateTime(2026, 1, 20, 8, 0, 0)),
            (playlist1, new Guid("660e8400-e29b-41d4-a716-446655440002"), new DateTime(2026, 1, 20, 8, 5, 0)),
            (playlist1, new Guid("660e8400-e29b-41d4-a716-446655440003"), new DateTime(2026, 1, 20, 8, 10, 0)),
            (playlist1, new Guid("660e8400-e29b-41d4-a716-446655440007"), new DateTime(2026, 1, 20, 8, 15, 0)),
            (playlist1, new Guid("660e8400-e29b-41d4-a716-446655440008"), new DateTime(2026, 1, 20, 8, 20, 0)),

            // Playlist 2: Chill & Relax
            (playlist2, new Guid("660e8400-e29b-41d4-a716-446655440004"), new DateTime(2026, 1, 21, 9, 30, 0)),
            (playlist2, new Guid("660e8400-e29b-41d4-a716-446655440005"), new DateTime(2026, 1, 21, 9, 35, 0)),
            (playlist2, new Guid("660e8400-e29b-41d4-a716-446655440006"), new DateTime(2026, 1, 21, 9, 40, 0))
        };

        foreach (var item in playlistItems)
        {
            var parameters = new
            {
                PlaylistId = item.playlistId,
                MediaItemId = item.mediaItemId,
                AddedAt = item.addedAt
            };

            var command = new CommandDefinition(sql, parameters, transaction: transaction);
            await connection.ExecuteAsync(command);
        }
    }

    /// Seed favorites - Các media items mà users yêu thích
    private async Task SeedFavouritesAsync(IDbConnection connection, IDbTransaction transaction)
    {
        const string sql = @"
            INSERT INTO Favourites (UserId, MediaItemId, AddedAt)
            VALUES (@UserId, @MediaItemId, @AddedAt)";

        var adminId = new Guid("550e8400-e29b-41d4-a716-446655440001");
        var johnId = new Guid("550e8400-e29b-41d4-a716-446655440002");

        var favourites = new List<(Guid userId, Guid mediaItemId, DateTime addedAt)>
        {
            // Admin favorites
            (adminId, new Guid("660e8400-e29b-41d4-a716-446655440001"), new DateTime(2026, 1, 25, 10, 0, 0)),
            (adminId, new Guid("660e8400-e29b-41d4-a716-446655440004"), new DateTime(2026, 1, 25, 10, 5, 0)),

            // John favorites
            (johnId, new Guid("660e8400-e29b-41d4-a716-446655440003"), new DateTime(2026, 1, 25, 11, 0, 0))
        };

        foreach (var fav in favourites)
        {
            var parameters = new
            {
                UserId = fav.userId,
                MediaItemId = fav.mediaItemId,
                AddedAt = fav.addedAt
            };

            var command = new CommandDefinition(sql, parameters, transaction: transaction);
            await connection.ExecuteAsync(command);
        }
    }

    /// Seed follows - Follow relationships giữa users
    private async Task SeedFollowsAsync(IDbConnection connection, IDbTransaction transaction)
    {
        const string sql = @"
            INSERT INTO Follows (FollowerId, FollowedId, FollowedAt)
            VALUES (@FollowerId, @FollowedId, @FollowedAt)";

        var adminId = new Guid("550e8400-e29b-41d4-a716-446655440001");
        var johnId = new Guid("550e8400-e29b-41d4-a716-446655440002");

        var follows = new List<(Guid followerId, Guid followedId, DateTime followedAt)>
        {
            // john_music follows admin
            (johnId, adminId, new DateTime(2026, 1, 26, 12, 0, 0))
        };

        foreach (var follow in follows)
        {
            var parameters = new
            {
                FollowerId = follow.followerId,
                FollowedId = follow.followedId,
                FollowedAt = follow.followedAt
            };

            var command = new CommandDefinition(sql, parameters, transaction: transaction);
            await connection.ExecuteAsync(command);
        }
    }

    /// Seed media shares - Chia sẻ media giữa users
    private async Task SeedMediaSharesAsync(IDbConnection connection, IDbTransaction transaction)
    {
        const string sql = @"
            INSERT INTO MediaShares (Id, MediaItemId, SharedByUserId, SharedToUserId, SharedAt)
            VALUES (@Id, @MediaItemId, @SharedByUserId, @SharedToUserId, @SharedAt)";

        var adminId = new Guid("550e8400-e29b-41d4-a716-446655440001");
        var johnId = new Guid("550e8400-e29b-41d4-a716-446655440002");

        var shares = new List<(Guid id, Guid mediaItemId, Guid sharedByUserId, Guid sharedToUserId, DateTime sharedAt)>
        {
            // Admin shares "Blinding Lights" with john
            (
                new Guid("880e8400-e29b-41d4-a716-446655440001"),
                new Guid("660e8400-e29b-41d4-a716-446655440001"),
                adminId,
                johnId,
                new DateTime(2026, 1, 27, 13, 0, 0)
            )
        };

        foreach (var share in shares)
        {
            var parameters = new
            {
                Id = share.id,
                MediaItemId = share.mediaItemId,
                SharedByUserId = share.sharedByUserId,
                SharedToUserId = share.sharedToUserId,
                SharedAt = share.sharedAt
            };

            var command = new CommandDefinition(sql, parameters, transaction: transaction);
            await connection.ExecuteAsync(command);
        }
    }

    /// Seed notifications - Thông báo cho users
    private async Task SeedNotificationsAsync(IDbConnection connection, IDbTransaction transaction)
    {
        const string sql = @"
            INSERT INTO Notifications (Id, UserId, Type, Message, IsRead, CreatedAt)
            VALUES (@Id, @UserId, @Type, @Message, @IsRead, @CreatedAt)";

        var adminId = new Guid("550e8400-e29b-41d4-a716-446655440001");
        var johnId = new Guid("550e8400-e29b-41d4-a716-446655440002");

        var notifications = new List<dynamic>
        {
            // Notification cho john: admin shared a song
            new
            {
                Id = new Guid("990e8400-e29b-41d4-a716-446655440001"),
                UserId = johnId,
                Type = 0,  // Share notification
                Message = "admin shared \"Blinding Lights\" with you",
                IsRead = 0,
                CreatedAt = new DateTime(2026, 1, 27, 13, 5, 0)
            },
            // Notification cho admin: john followed
            new
            {
                Id = new Guid("990e8400-e29b-41d4-a716-446655440002"),
                UserId = adminId,
                Type = 1,  // Follow notification
                Message = "john_music is now following you",
                IsRead = 0,
                CreatedAt = new DateTime(2026, 1, 26, 12, 5, 0)
            }
        };

        foreach (var notification in notifications)
        {
            var command = new CommandDefinition(sql, notification, transaction: transaction);
            await connection.ExecuteAsync(command);
        }
    }
}
