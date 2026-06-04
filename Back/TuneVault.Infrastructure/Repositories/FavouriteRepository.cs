using Dapper;
using TuneVault.Application.Interfaces;
using TuneVault.Domain.Entities;
using TuneVault.Infrastructure.Data;

namespace TuneVault.Infrastructure.Repositories;

public class FavouriteRepository : IFavouriteRepository
{
    private readonly ISqlConnectionFactory _connectionFactory;

    public FavouriteRepository(ISqlConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task AddAsync(Guid userId, Guid mediaItemId, CancellationToken cancellationToken = default)
    {
        const string sql = @"
            INSERT INTO Favourites (UserId, MediaItemId, AddedAt)
            VALUES (@UserId, @MediaItemId, @AddedAt)";

        using (var connection = _connectionFactory.CreateConnection())
        {
            var parameters = new
            {
                UserId = userId,
                MediaItemId = mediaItemId,
                AddedAt = DateTime.UtcNow
            };
            var command = new CommandDefinition(sql, parameters, cancellationToken: cancellationToken);
            await connection.ExecuteAsync(command);
        }
    }

    public async Task<bool> RemoveAsync(Guid userId, Guid mediaItemId, CancellationToken cancellationToken = default)
    {
        const string sql = @"
            DELETE FROM Favourites
            WHERE UserId = @UserId AND MediaItemId = @MediaItemId";

        using (var connection = _connectionFactory.CreateConnection())
        {
            var parameters = new { UserId = userId, MediaItemId = mediaItemId };
            var command = new CommandDefinition(sql, parameters, cancellationToken: cancellationToken);
            var affectedRows = await connection.ExecuteAsync(command);
            return affectedRows > 0;
        }
    }

    public async Task<IReadOnlyList<MediaItem>> GetByUserIdAsync(Guid userId, int limit = 50, CancellationToken cancellationToken = default)
    {
        const string sql = @"
            SELECT TOP (@Limit) m.Id, m.Title, m.Artist, m.FilePath, m.MediaType, m.DurationSeconds, m.CreatedAt, m.OwnerId
            FROM MediaItems m
            INNER JOIN Favourites f ON m.Id = f.MediaItemId
            WHERE f.UserId = @UserId
            ORDER BY f.AddedAt DESC";

        using (var connection = _connectionFactory.CreateConnection())
        {
            var parameters = new { UserId = userId, Limit = limit };
            var command = new CommandDefinition(sql, parameters, cancellationToken: cancellationToken);
            var mediaItems = await connection.QueryAsync<MediaItem>(command);
            return mediaItems.ToList();
        }
    }

    public async Task<bool> ExistsAsync(Guid userId, Guid mediaItemId, CancellationToken cancellationToken = default)
    {
        const string sql = @"
            SELECT COUNT(*)
            FROM Favourites
            WHERE UserId = @UserId AND MediaItemId = @MediaItemId";

        using (var connection = _connectionFactory.CreateConnection())
        {
            var parameters = new { UserId = userId, MediaItemId = mediaItemId };
            var command = new CommandDefinition(sql, parameters, cancellationToken: cancellationToken);
            var count = await connection.QuerySingleAsync<int>(command);
            return count > 0;
        }
    }

    public async Task<int> GetCountByUserIdAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        const string sql = @"
            SELECT COUNT(*)
            FROM Favourites
            WHERE UserId = @UserId";

        using (var connection = _connectionFactory.CreateConnection())
        {
            var parameters = new { UserId = userId };
            var command = new CommandDefinition(sql, parameters, cancellationToken: cancellationToken);
            var count = await connection.QuerySingleAsync<int>(command);
            return count;
        }
    }
}
