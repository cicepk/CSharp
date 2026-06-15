using Dapper;
using TuneVault.Application.Interfaces;
using TuneVault.Domain.Entities;
using TuneVault.Infrastructure.Data;

namespace TuneVault.Infrastructure.Repositories;

public class FollowRepository : IFollowRepository
{
    private readonly ISqlConnectionFactory _connectionFactory;

    public FollowRepository(ISqlConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task FollowAsync(Guid followerId, Guid followedId, CancellationToken cancellationToken = default)
    {
        const string sql = @"
            INSERT INTO Follows (FollowerId, FollowedId, FollowedAt)
            VALUES (@FollowerId, @FollowedId, @FollowedAt)";

        using (var connection = _connectionFactory.CreateConnection())
        {
            var parameters = new
            {
                FollowerId = followerId,
                FollowedId = followedId,
                FollowedAt = DateTime.UtcNow
            };
            var command = new CommandDefinition(sql, parameters, cancellationToken: cancellationToken);
            await connection.ExecuteAsync(command);
        }
    }

    public async Task<bool> UnfollowAsync(Guid followerId, Guid followedId, CancellationToken cancellationToken = default)
    {
        const string sql = @"
            DELETE FROM Follows
            WHERE FollowerId = @FollowerId AND FollowedId = @FollowedId";

        using (var connection = _connectionFactory.CreateConnection())
        {
            var parameters = new { FollowerId = followerId, FollowedId = followedId };
            var command = new CommandDefinition(sql, parameters, cancellationToken: cancellationToken);
            var affectedRows = await connection.ExecuteAsync(command);
            return affectedRows > 0;
        }
    }

    public async Task<IReadOnlyList<UserProfile>> GetFollowersAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        const string sql = @"
            SELECT u.Id, u.UserName, u.Email, u.CreatedAt
            FROM UserProfiles u
            INNER JOIN Follows f ON u.Id = f.FollowerId
            WHERE f.FollowedId = @UserId
            ORDER BY f.FollowedAt DESC";

        using (var connection = _connectionFactory.CreateConnection())
        {
            var parameters = new { UserId = userId };
            var command = new CommandDefinition(sql, parameters, cancellationToken: cancellationToken);
            var users = await connection.QueryAsync<UserProfile>(command);
            return users.ToList();
        }
    }

    public async Task<IReadOnlyList<UserProfile>> GetFollowingAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        const string sql = @"
            SELECT u.Id, u.UserName, u.Email, u.CreatedAt
            FROM UserProfiles u
            INNER JOIN Follows f ON u.Id = f.FollowedId
            WHERE f.FollowerId = @UserId
            ORDER BY f.FollowedAt DESC";

        using (var connection = _connectionFactory.CreateConnection())
        {
            var parameters = new { UserId = userId };
            var command = new CommandDefinition(sql, parameters, cancellationToken: cancellationToken);
            var users = await connection.QueryAsync<UserProfile>(command);
            return users.ToList();
        }
    }

    public async Task<bool> IsFollowingAsync(Guid followerId, Guid followedId, CancellationToken cancellationToken = default)
    {
        const string sql = @"
            SELECT COUNT(*)
            FROM Follows
            WHERE FollowerId = @FollowerId AND FollowedId = @FollowedId";

        using (var connection = _connectionFactory.CreateConnection())
        {
            var parameters = new { FollowerId = followerId, FollowedId = followedId };
            var command = new CommandDefinition(sql, parameters, cancellationToken: cancellationToken);
            var count = await connection.QuerySingleAsync<int>(command);
            return count > 0;
        }
    }

    public async Task<int> GetFollowerCountAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        const string sql = @"
            SELECT COUNT(*)
            FROM Follows
            WHERE FollowedId = @UserId";

        using (var connection = _connectionFactory.CreateConnection())
        {
            var parameters = new { UserId = userId };
            var command = new CommandDefinition(sql, parameters, cancellationToken: cancellationToken);
            var count = await connection.QuerySingleAsync<int>(command);
            return count;
        }
    }

    public async Task<int> GetFollowingCountAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        const string sql = @"
            SELECT COUNT(*)
            FROM Follows
            WHERE FollowerId = @UserId";

        using (var connection = _connectionFactory.CreateConnection())
        {
            var parameters = new { UserId = userId };
            var command = new CommandDefinition(sql, parameters, cancellationToken: cancellationToken);
            var count = await connection.QuerySingleAsync<int>(command);
            return count;
        }
    }
}
