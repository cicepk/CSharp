using Dapper;
using System.Data;
using TuneVault.Application.Interfaces;
using TuneVault.Infrastructure.Data;

namespace TuneVault.Infrastructure.Seeders;

public class DataSeeder : IDataSeeder
{
    private readonly ISqlConnectionFactory _connectionFactory;

    public DataSeeder(ISqlConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    /// Check if UserProfiles table exists with proper schema
    private async Task<bool> SchemaIsValidAsync()
    {
        const string sql = @"
            SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'UserProfiles' AND COLUMN_NAME = 'Bio'";

        try
        {
            using (var connection = _connectionFactory.CreateConnection())
            {
                var command = new CommandDefinition(sql);
                var count = await connection.ExecuteScalarAsync<int>(command);
                return count > 0;  // Bio column exists = schema is valid
            }
        }
        catch
        {
            return false;
        }
    }

    /// Check if UserProfiles table exists
    private async Task<bool> TableExistsAsync()
    {
        const string sql = @"
            SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_NAME = 'UserProfiles'";

        try
        {
            using (var connection = _connectionFactory.CreateConnection())
            {
                var command = new CommandDefinition(sql);
                var count = await connection.ExecuteScalarAsync<int>(command);
                return count > 0;
            }
        }
        catch
        {
            return false;
        }
    }

    /// Initialize database schema by executing schema.sql
    private async Task InitializeDatabaseSchemaAsync()
    {
        Console.WriteLine(" 📋 Creating database schema...");

        // Look for schema.sql next to the running assembly first (Docker / published mode),
        // then fall back to the dev-time directory navigation.
        string schemaPath;
        var appBase = AppContext.BaseDirectory;
        var candidate = System.IO.Path.Combine(appBase, "schema.sql");
        if (System.IO.File.Exists(candidate))
        {
            schemaPath = candidate;
        }
        else
        {
            var assemblyLocation = System.Reflection.Assembly.GetExecutingAssembly().Location;
            var binDir = System.IO.Path.GetDirectoryName(assemblyLocation);
            if (binDir == null)
                throw new InvalidOperationException("Cannot determine assembly directory");
            var backDir = binDir;
            for (int i = 0; i < 4; i++)
            {
                backDir = System.IO.Path.GetDirectoryName(backDir);
                if (backDir == null)
                    throw new InvalidOperationException("Cannot navigate to Back directory");
            }
            schemaPath = System.IO.Path.GetFullPath(
                System.IO.Path.Combine(backDir, "TuneVault.Infrastructure", "Database", "schema.sql"));
        }

        if (!System.IO.File.Exists(schemaPath))
        {
            Console.WriteLine($" ⚠️  Schema file not found at: {schemaPath}");
            throw new FileNotFoundException($"Schema file not found: {schemaPath}");
        }

        var schema = await System.IO.File.ReadAllTextAsync(schemaPath);

        try
        {
            using (var connection = _connectionFactory.CreateConnection())
            {
                connection.Open();
                
                // First, disable all foreign key constraints
                Console.WriteLine(" 🔓 Disabling foreign key constraints...");
                try
                {
                    var cmd = new CommandDefinition("EXEC sp_MSForEachTable 'ALTER TABLE ? NOCHECK CONSTRAINT ALL'");
                    await connection.ExecuteAsync(cmd);
                }
                catch
                {
                    // Might fail if no tables exist, that's OK
                }
                
                // Drop all tables dynamically
                Console.WriteLine(" 🗑️  Dropping existing tables...");
                try
                {
                    var dropTablesSQL = @"
                        DECLARE @sql NVARCHAR(MAX);
                        SELECT @sql = ISNULL(@sql + ';', '') + 'DROP TABLE [' + t.TABLE_NAME + ']'
                        FROM INFORMATION_SCHEMA.TABLES t
                        WHERE t.TABLE_TYPE = 'BASE TABLE' 
                        AND t.TABLE_SCHEMA = 'dbo'
                        
                        IF @sql IS NOT NULL
                            EXEC sp_executesql @sql
                    ";
                    var cmd = new CommandDefinition(dropTablesSQL);
                    await connection.ExecuteAsync(cmd);
                    Console.WriteLine(" ✅ Old tables dropped");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($" ⚠️  Could not drop tables: {ex.Message}");
                }
                
                // Execute schema creation
                Console.WriteLine(" 📝 Creating new schema...");
                var statements = schema.Split(new[] { "\r\nGO\r\n", "\nGO\n", "\r\nGO", "\nGO", "GO" }, StringSplitOptions.RemoveEmptyEntries);
                
                int statementCount = 0;
                foreach (var statement in statements)
                {
                    var trimmed = statement.Trim();
                    if (!string.IsNullOrWhiteSpace(trimmed))
                    {
                        try
                        {
                            var command = new CommandDefinition(trimmed);
                            await connection.ExecuteAsync(command);
                            statementCount++;
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"   ⚠️  Statement failed: {ex.Message}");
                            // Continue with next statement - some might be dependent
                        }
                    }
                }

                Console.WriteLine($" ✅ Database schema created successfully! ({statementCount} statements executed)");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($" ❌ Error creating schema: {ex.Message}");
            throw;
        }
    }

    /// Kiểm tra xem database đã có data chưa
    public async Task<bool> IsSeededAsync()
    {
        // First check if table exists
        if (!await TableExistsAsync())
        {
            return false;
        }

        const string sql = "SELECT COUNT(*) FROM UserProfiles";

        try
        {
            using (var connection = _connectionFactory.CreateConnection())
            {
                var command = new CommandDefinition(sql);
                var count = await connection.ExecuteScalarAsync<int>(command);
                
                // Nếu đã có ≥ 1 user → database đã được seed
                return count > 0;
            }
        }
        catch
        {
            return false;
        }
    }

    /// Thực hiện seeding tất cả dữ liệu
    public async Task SeedAsync()
    {
        // First ensure database schema is valid (recreate if schema is outdated)
        if (!await SchemaIsValidAsync())
        {
            Console.WriteLine(" ⚠️  Schema is invalid or outdated. Reinitializing...");
            await InitializeDatabaseSchemaAsync();
        }

        // Check if database has already been seeded
        if (await IsSeededAsync())
        {
            Console.WriteLine(" ✅ Database already seeded, skipping data seeding.");
            return;
        }

        Console.WriteLine(" 🌱 Starting data seeding...");

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
                        Console.WriteLine(" Seed 13 media items (10 audio + 3 video) thành công");

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

    /// Seed 2 users (password: Password123)
    private async Task SeedUsersAsync(IDbConnection connection, IDbTransaction transaction)
    {
        const string sql = @"
            INSERT INTO UserProfiles (Id, UserName, Email, PasswordHash, CreatedAt)
            VALUES (@Id, @UserName, @Email, @PasswordHash, @CreatedAt)";

        // Password chung cho cả 2 users: Password123
        var passwordHash = BCrypt.Net.BCrypt.HashPassword("Password123");

        var users = new List<(Guid id, string userName, string email, DateTime createdAt)>
        {
            (
                new Guid("550e8400-e29b-41d4-a716-446655440001"),
                "admin",
                "admin@tunevault.com",
                new DateTime(2026, 1, 1, 10, 0, 0)
            ),
            (
                new Guid("550e8400-e29b-41d4-a716-446655440002"),
                "john_music",
                "john@tunevault.com",
                new DateTime(2026, 1, 5, 14, 30, 0)
            )
        };

        foreach (var user in users)
        {
            var parameters = new
            {
                Id = user.id,
                UserName = user.userName,
                Email = user.email,
                PasswordHash = passwordHash,
                CreatedAt = user.createdAt
            };

            var command = new CommandDefinition(sql, parameters, transaction: transaction);
            await connection.ExecuteAsync(command);
        }
    }

    /// 10 audio items — files baked into Docker image under wwwroot/music/
    private async Task SeedMediaItemsAsync(IDbConnection connection, IDbTransaction transaction)
    {
        const string sql = @"
            INSERT INTO MediaItems (Id, Title, Artist, FilePath, CoverPath, MediaType, DurationSeconds, CreatedAt, OwnerId)
            VALUES (@Id, @Title, @Artist, @FilePath, @CoverPath, @MediaType, @DurationSeconds, @CreatedAt, @OwnerId)";

        var adminId = new Guid("550e8400-e29b-41d4-a716-446655440001");

        var mediaItems = new List<dynamic>
        {
            new {
                Id = new Guid("660e8400-e29b-41d4-a716-446655440001"),
                Title = "I Can't Feel", Artist = "Aylex",
                FilePath  = "/music/audio/Aylex - I Can't Feel (freetouse.com).mp3",
                CoverPath = "/music/images/Black  Mixtape Cover  Album Cover - Made with PosterMyWall.jpg",
                MediaType = 1, DurationSeconds = 180,
                CreatedAt = new DateTime(2026, 1, 10, 8, 0, 0), OwnerId = adminId
            },
            new {
                Id = new Guid("660e8400-e29b-41d4-a716-446655440002"),
                Title = "Turn It Louder", Artist = "Aylex",
                FilePath  = "/music/audio/Aylex - Turn It Louder (freetouse.com).mp3",
                CoverPath = "/music/images/Neon Music Album Cover Album Cover - Made with PosterMyWall.jpg",
                MediaType = 1, DurationSeconds = 195,
                CreatedAt = new DateTime(2026, 1, 11, 9, 30, 0), OwnerId = adminId
            },
            new {
                Id = new Guid("660e8400-e29b-41d4-a716-446655440003"),
                Title = "All Night", Artist = "Burgundy",
                FilePath  = "/music/audio/Burgundy - All Night (freetouse.com).mp3",
                CoverPath = "/music/images/Red Neon Music Album Cover Album Cover - Made with PosterMyWall.jpg",
                MediaType = 1, DurationSeconds = 210,
                CreatedAt = new DateTime(2026, 1, 12, 10, 15, 0), OwnerId = adminId
            },
            new {
                Id = new Guid("660e8400-e29b-41d4-a716-446655440004"),
                Title = "Clarity", Artist = "Damtaro",
                FilePath  = "/music/audio/Damtaro - Clarity (freetouse.com).mp3",
                CoverPath = "/music/images/Blue Inception Album Cover - Made with PosterMyWall.jpg",
                MediaType = 1, DurationSeconds = 225,
                CreatedAt = new DateTime(2026, 1, 13, 11, 0, 0), OwnerId = adminId
            },
            new {
                Id = new Guid("660e8400-e29b-41d4-a716-446655440005"),
                Title = "Wandering", Artist = "Epic Spectrum",
                FilePath  = "/music/audio/Epic Spectrum - Wandering (freetouse.com).mp3",
                CoverPath = "/music/images/Purple Abstract Album Cover - Made with PosterMyWall.jpg",
                MediaType = 1, DurationSeconds = 240,
                CreatedAt = new DateTime(2026, 1, 14, 12, 30, 0), OwnerId = adminId
            },
            new {
                Id = new Guid("660e8400-e29b-41d4-a716-446655440006"),
                Title = "End of Times", Artist = "Guillermo Guareschi",
                FilePath  = "/music/audio/Guillermo Guareschi - End of Times (freetouse.com).mp3",
                CoverPath = "/music/images/Black Indie Rock Album Cover - Made with PosterMyWall.jpg",
                MediaType = 1, DurationSeconds = 255,
                CreatedAt = new DateTime(2026, 1, 15, 13, 45, 0), OwnerId = adminId
            },
            new {
                Id = new Guid("660e8400-e29b-41d4-a716-446655440007"),
                Title = "Memories", Artist = "Lukrembo",
                FilePath  = "/music/audio/Lukrembo - Memories (freetouse.com).mp3",
                CoverPath = "/music/images/Pink Modern  Minimal Music Album Cover Album Cover - Made with PosterMyWall.jpg",
                MediaType = 1, DurationSeconds = 188,
                CreatedAt = new DateTime(2026, 1, 16, 14, 0, 0), OwnerId = adminId
            },
            new {
                Id = new Guid("660e8400-e29b-41d4-a716-446655440008"),
                Title = "Kyoto", Artist = "Nebulite",
                FilePath  = "/music/audio/Nebulite - Kyoto (freetouse.com).mp3",
                CoverPath = "/music/images/Pop Album Cover - Made with PosterMyWall.jpg",
                MediaType = 1, DurationSeconds = 202,
                CreatedAt = new DateTime(2026, 1, 17, 15, 20, 0), OwnerId = adminId
            },
            new {
                Id = new Guid("660e8400-e29b-41d4-a716-446655440009"),
                Title = "Deep Within", Artist = "Sunborn",
                FilePath  = "/music/audio/Sunborn - Deep Within (freetouse.com).mp3",
                CoverPath = "/music/images/Square abstract album cover template - Made with PosterMyWall.jpg",
                MediaType = 1, DurationSeconds = 218,
                CreatedAt = new DateTime(2026, 1, 18, 16, 30, 0), OwnerId = adminId
            },
            new {
                Id = new Guid("660e8400-e29b-41d4-a716-446655440010"),
                Title = "Final Scene", Artist = "Walen",
                FilePath  = "/music/audio/Walen - Final Scene (freetouse.com).mp3",
                CoverPath = "/music/images/Black Floral Illustrative Album Cover - Made with PosterMyWall.jpg",
                MediaType = 1, DurationSeconds = 230,
                CreatedAt = new DateTime(2026, 1, 19, 17, 15, 0), OwnerId = adminId
            },
            // --- Video items ---
            new {
                Id = new Guid("660e8400-e29b-41d4-a716-446655440011"),
                Title = "Here With Me", Artist = "d4vd",
                FilePath  = "/music/video/d4vd - Here With Me .mp4",
                CoverPath = "/music/images/here with me.png",
                MediaType = 2, DurationSeconds = 225,
                CreatedAt = new DateTime(2026, 1, 20, 10, 0, 0), OwnerId = adminId
            },
            new {
                Id = new Guid("660e8400-e29b-41d4-a716-446655440012"),
                Title = "Die With A Smile", Artist = "Lady Gaga, Bruno Mars",
                FilePath  = "/music/video/Lady Gaga, Bruno Mars - Die With A Smile.mp4",
                CoverPath = "/music/images/die with a smile.png",
                MediaType = 2, DurationSeconds = 253,
                CreatedAt = new DateTime(2026, 1, 20, 10, 30, 0), OwnerId = adminId
            },
            new {
                Id = new Guid("660e8400-e29b-41d4-a716-446655440013"),
                Title = "Blank Space", Artist = "Taylor Swift",
                FilePath  = "/music/video/Taylor Swift - Blank Space.mp4",
                CoverPath = "/music/images/Taylor_Swift_-_Blank_Space.png",
                MediaType = 2, DurationSeconds = 231,
                CreatedAt = new DateTime(2026, 1, 20, 11, 0, 0), OwnerId = adminId
            },
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
            INSERT INTO PlaylistItems (Id, PlaylistId, MediaItemId, AddedAt)
            VALUES (@Id, @PlaylistId, @MediaItemId, @AddedAt)";

        var playlist1 = new Guid("770e8400-e29b-41d4-a716-446655440001");
        var playlist2 = new Guid("770e8400-e29b-41d4-a716-446655440002");

        var playlistItems = new List<(Guid id, Guid playlistId, Guid mediaItemId, DateTime addedAt)>
        {
            // Playlist 1: Pop Hits
            (Guid.NewGuid(), playlist1, new Guid("660e8400-e29b-41d4-a716-446655440001"), new DateTime(2026, 1, 20, 8, 0, 0)),
            (Guid.NewGuid(), playlist1, new Guid("660e8400-e29b-41d4-a716-446655440002"), new DateTime(2026, 1, 20, 8, 5, 0)),
            (Guid.NewGuid(), playlist1, new Guid("660e8400-e29b-41d4-a716-446655440003"), new DateTime(2026, 1, 20, 8, 10, 0)),
            (Guid.NewGuid(), playlist1, new Guid("660e8400-e29b-41d4-a716-446655440007"), new DateTime(2026, 1, 20, 8, 15, 0)),
            (Guid.NewGuid(), playlist1, new Guid("660e8400-e29b-41d4-a716-446655440008"), new DateTime(2026, 1, 20, 8, 20, 0)),

            // Playlist 2: Chill & Relax
            (Guid.NewGuid(), playlist2, new Guid("660e8400-e29b-41d4-a716-446655440004"), new DateTime(2026, 1, 21, 9, 30, 0)),
            (Guid.NewGuid(), playlist2, new Guid("660e8400-e29b-41d4-a716-446655440005"), new DateTime(2026, 1, 21, 9, 35, 0)),
            (Guid.NewGuid(), playlist2, new Guid("660e8400-e29b-41d4-a716-446655440006"), new DateTime(2026, 1, 21, 9, 40, 0))
        };

        foreach (var item in playlistItems)
        {
            var parameters = new
            {
                Id = item.id,
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
                Type = 1,  // Shared = 1
                Message = "admin shared \"Blinding Lights\" with you",
                IsRead = 0,
                CreatedAt = new DateTime(2026, 1, 27, 13, 5, 0)
            },
            // Notification cho admin: john followed
            new
            {
                Id = new Guid("990e8400-e29b-41d4-a716-446655440002"),
                UserId = adminId,
                Type = 2,  // Followed = 2
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
