using Dapper;
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
            SELECT Id, UserName, Email, Bio, AvatarPath, CreatedAt
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
            SELECT Id, UserName, Email, Bio, AvatarPath, CreatedAt
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
            SELECT Id, UserName, Email, Bio, AvatarPath, CreatedAt
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
            INSERT INTO UserProfiles (Id, UserName, Email, CreatedAt, PasswordHash)
            VALUES (@Id, @UserName, @Email, @CreatedAt, @PasswordHash)";

        using (var connection = _connectionFactory.CreateConnection())
        {
            var parameters = new
            {
                user.Id,
                user.UserName,
                user.Email,
                user.CreatedAt,
                PasswordHash = passwordHash
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
        const string sql = "DELETE FROM UserProfiles WHERE Id = @Id";

        using (var connection = _connectionFactory.CreateConnection())
        {
            var parameters = new { Id = id };
            var command = new CommandDefinition(sql, parameters, cancellationToken: cancellationToken);
            var affectedRows = await connection.ExecuteAsync(command);
            return affectedRows > 0;
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
            SELECT TOP (@Limit) Id, UserName, Email, Bio, AvatarPath, CreatedAt
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
}
