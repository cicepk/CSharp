using Dapper;
using TuneVault.Application.DTOs.Admin;
using TuneVault.Application.Interfaces;
using TuneVault.Domain.Entities;
using TuneVault.Infrastructure.Data;

namespace TuneVault.Infrastructure.Repositories;

public class UserRepository : IUserRepository
{
    private readonly ISqlConnectionFactory _connectionFactory;

    public UserRepository(ISqlConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task<UserProfile?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        const string sql = @"
            SELECT Id, UserName, Email, Bio, AvatarPath, CreatedAt, Role
            FROM UserProfiles
            WHERE Id = @Id";

        using (var connection = _connectionFactory.CreateConnection())
        {
            var parameters = new { Id = id };
            var command = new CommandDefinition(sql, parameters, cancellationToken: cancellationToken);
            var user = await connection.QuerySingleOrDefaultAsync<UserProfile>(command);
            return user;
        }
    }

    public async Task<UserProfile?> GetByEmailAsync(string email, CancellationToken cancellationToken = default)
    {
        const string sql = @"
            SELECT Id, UserName, Email, Bio, AvatarPath, CreatedAt, Role
            FROM UserProfiles
            WHERE Email = @Email";

        using (var connection = _connectionFactory.CreateConnection())
        {
            var parameters = new { Email = email };
            var command = new CommandDefinition(sql, parameters, cancellationToken: cancellationToken);
            var user = await connection.QuerySingleOrDefaultAsync<UserProfile>(command);
            return user;
        }
    }

    public async Task<UserProfile?> GetByUsernameAsync(string username, CancellationToken cancellationToken = default)
    {
        const string sql = @"
            SELECT Id, UserName, Email, Bio, AvatarPath, CreatedAt, Role
            FROM UserProfiles
            WHERE UserName = @UserName";

        using (var connection = _connectionFactory.CreateConnection())
        {
            var parameters = new { UserName = username };
            var command = new CommandDefinition(sql, parameters, cancellationToken: cancellationToken);
            var user = await connection.QuerySingleOrDefaultAsync<UserProfile>(command);
            return user;
        }
    }

    public async Task<Guid> CreateAsync(UserProfile user, string passwordHash, CancellationToken cancellationToken = default)
    {
        const string sql = @"
            INSERT INTO UserProfiles (Id, UserName, Email, CreatedAt, PasswordHash, Role)
            VALUES (@Id, @UserName, @Email, @CreatedAt, @PasswordHash, @Role)";

        using (var connection = _connectionFactory.CreateConnection())
        {
            var parameters = new
            {
                user.Id,
                user.UserName,
                user.Email,
                user.CreatedAt,
                PasswordHash = passwordHash,
                Role = (int)user.Role
            };
            var command = new CommandDefinition(sql, parameters, cancellationToken: cancellationToken);
            await connection.ExecuteAsync(command);
            return user.Id;
        }
    }

    public async Task<bool> UpdateAsync(UserProfile user, CancellationToken cancellationToken = default)
    {
        const string sql = @"
            UPDATE UserProfiles
            SET UserName = @UserName,
                Email = @Email,
                Bio = @Bio,
                AvatarPath = @AvatarPath
            WHERE Id = @Id";

        using (var connection = _connectionFactory.CreateConnection())
        {
            var parameters = new
            {
                user.Id,
                user.UserName,
                user.Email,
                user.Bio,
                user.AvatarPath
            };
            var command = new CommandDefinition(sql, parameters, cancellationToken: cancellationToken);
            var affectedRows = await connection.ExecuteAsync(command);
            return affectedRows > 0;
        }
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        using (var connection = _connectionFactory.CreateConnection())
        {
            connection.Open();
            using var transaction = connection.BeginTransaction();
            try
            {
                var p = new { Id = id };

                // 1. PlaylistItems: items trong playlist của user, hoặc items là media của user trong playlist bất kỳ
                await connection.ExecuteAsync(new CommandDefinition(@"
                    DELETE FROM PlaylistItems
                    WHERE PlaylistId IN (SELECT Id FROM Playlists WHERE OwnerId = @Id)
                       OR MediaItemId IN (SELECT Id FROM MediaItems WHERE OwnerId = @Id)",
                    p, transaction, cancellationToken: cancellationToken));

                // 2. MediaShares: share liên quan đến user hoặc nội dung của user
                await connection.ExecuteAsync(new CommandDefinition(@"
                    DELETE FROM MediaShares
                    WHERE SharedByUserId = @Id
                       OR SharedToUserId = @Id
                       OR MediaItemId IN (SELECT Id FROM MediaItems WHERE OwnerId = @Id)
                       OR PlaylistId   IN (SELECT Id FROM Playlists  WHERE OwnerId = @Id)",
                    p, transaction, cancellationToken: cancellationToken));

                // 3. Follows: user follow hoặc được follow
                await connection.ExecuteAsync(new CommandDefinition(
                    "DELETE FROM Follows WHERE FollowerId = @Id OR FollowedId = @Id",
                    p, transaction, cancellationToken: cancellationToken));

                // 4. Favourites của user khác trỏ vào media của user bị xóa
                await connection.ExecuteAsync(new CommandDefinition(@"
                    DELETE FROM Favourites
                    WHERE MediaItemId IN (SELECT Id FROM MediaItems WHERE OwnerId = @Id)",
                    p, transaction, cancellationToken: cancellationToken));

                // 5. PlayHistory của user khác cho media của user bị xóa (FK ON DELETE NO ACTION)
                await connection.ExecuteAsync(new CommandDefinition(@"
                    DELETE FROM PlayHistory
                    WHERE MediaItemId IN (SELECT Id FROM MediaItems WHERE OwnerId = @Id)",
                    p, transaction, cancellationToken: cancellationToken));

                // 6. Xóa UserProfiles — cascade tự động xóa: Playlists, MediaItems,
                //    Notifications, Favourites (own), PlayHistory (own)
                var affected = await connection.ExecuteAsync(new CommandDefinition(
                    "DELETE FROM UserProfiles WHERE Id = @Id",
                    p, transaction, cancellationToken: cancellationToken));

                transaction.Commit();
                return affected > 0;
            }
            catch
            {
                transaction.Rollback();
                throw;
            }
        }
    }

    public async Task<string?> GetPasswordHashAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        const string sql = @"
            SELECT PasswordHash
            FROM UserProfiles
            WHERE Id = @Id";

        using (var connection = _connectionFactory.CreateConnection())
        {
            var parameters = new { Id = userId };
            var command = new CommandDefinition(sql, parameters, cancellationToken: cancellationToken);
            var result = await connection.QuerySingleOrDefaultAsync<string>(command);
            return result;
        }
    }

    public async Task<bool> ExistsAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        const string sql = "SELECT COUNT(*) FROM UserProfiles WHERE Id = @Id";

        using (var connection = _connectionFactory.CreateConnection())
        {
            var command = new CommandDefinition(sql, new { Id = userId }, cancellationToken: cancellationToken);
            var count = await connection.QuerySingleAsync<int>(command);
            return count > 0;
        }
    }

    public async Task<bool> UpdatePasswordHashAsync(Guid userId, string newPasswordHash, CancellationToken cancellationToken = default)
    {
        const string sql = @"
            UPDATE UserProfiles
            SET PasswordHash = @PasswordHash
            WHERE Id = @Id";

        using (var connection = _connectionFactory.CreateConnection())
        {
            var command = new CommandDefinition(sql, new { Id = userId, PasswordHash = newPasswordHash }, cancellationToken: cancellationToken);
            var affected = await connection.ExecuteAsync(command);
            return affected > 0;
        }
    }

    public async Task<IReadOnlyList<UserProfile>> SearchAsync(string query, int limit = 10, CancellationToken cancellationToken = default)
    {
        const string sql = @"
            SELECT TOP (@Limit) Id, UserName, Email, Bio, AvatarPath, CreatedAt, Role
            FROM UserProfiles
            WHERE UserName LIKE @Query
            ORDER BY UserName";

        using (var connection = _connectionFactory.CreateConnection())
        {
            var command = new CommandDefinition(sql,
                new { Query = $"%{query}%", Limit = limit },
                cancellationToken: cancellationToken);
            var results = await connection.QueryAsync<UserProfile>(command);
            return results.ToList().AsReadOnly();
        }
    }

    public async Task<IReadOnlyList<AdminUserDto>> GetAllWithUploadCountAsync(CancellationToken cancellationToken = default)
    {
        const string sql = @"
            SELECT u.Id, u.UserName AS Username, u.Email,
                   CASE u.Role WHEN 2 THEN 'Admin' ELSE 'User' END AS Role,
                   u.CreatedAt, COUNT(m.Id) AS UploadCount
            FROM UserProfiles u
            LEFT JOIN MediaItems m ON m.OwnerId = u.Id
            GROUP BY u.Id, u.UserName, u.Email, u.Role, u.CreatedAt
            ORDER BY u.CreatedAt";

        using (var connection = _connectionFactory.CreateConnection())
        {
            var command = new CommandDefinition(sql, cancellationToken: cancellationToken);
            var results = await connection.QueryAsync<AdminUserDto>(command);
            return results.ToList().AsReadOnly();
        }
    }

    public async Task<int> GetTotalUsersCountAsync(CancellationToken cancellationToken = default)
    {
        const string sql = "SELECT COUNT(*) FROM UserProfiles";

        using (var connection = _connectionFactory.CreateConnection())
        {
            var command = new CommandDefinition(sql, cancellationToken: cancellationToken);
            return await connection.ExecuteScalarAsync<int>(command);
        }
    }
}
