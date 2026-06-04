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
            SELECT Id, UserName, Email, CreatedAt
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
            SELECT Id, UserName, Email, CreatedAt
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
            SELECT Id, UserName, Email, CreatedAt
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
                Email = @Email
            WHERE Id = @Id";

        using (var connection = _connectionFactory.CreateConnection())
        {
            var parameters = new
            {
                user.Id,
                user.UserName,
                user.Email
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
}
