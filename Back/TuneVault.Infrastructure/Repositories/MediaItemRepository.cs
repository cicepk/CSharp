using Dapper;
using TuneVault.Application.Interfaces;
using TuneVault.Domain.Entities;
using TuneVault.Infrastructure.Data;

namespace TuneVault.Infrastructure.Repositories;
public class MediaItemRepository : IMediaItemRepository
{
    private readonly ISqlConnectionFactory _connectionFactory;

    public MediaItemRepository(ISqlConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task<IReadOnlyList<MediaItem>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        const string sql = @"
            SELECT Id, Title, Artist, FilePath, MediaType, DurationSeconds, CreatedAt, OwnerId
            FROM MediaItems";

        using (var connection = _connectionFactory.CreateConnection())
        {
            var command = new CommandDefinition(sql, cancellationToken: cancellationToken);
            var items = await connection.QueryAsync<MediaItem>(command);
            return items.ToList();
        }
    }

    public async Task<MediaItem?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        const string sql = @"
            SELECT Id, Title, Artist, FilePath, MediaType, DurationSeconds, CreatedAt, OwnerId
            FROM MediaItems
            WHERE Id = @Id";

        using (var connection = _connectionFactory.CreateConnection())
        {
            var parameters = new { Id = id };
            var command = new CommandDefinition(sql, parameters, cancellationToken: cancellationToken);
            var item = await connection.QuerySingleOrDefaultAsync<MediaItem>(command);
            return item;
        }
    }

    public async Task AddAsync(MediaItem mediaItem, CancellationToken cancellationToken = default)
    {
        const string sql = @"
            INSERT INTO MediaItems (Id, Title, Artist, FilePath, MediaType, DurationSeconds, CreatedAt, OwnerId)
            VALUES (@Id, @Title, @Artist, @FilePath, @MediaType, @DurationSeconds, @CreatedAt, @OwnerId)";

        using (var connection = _connectionFactory.CreateConnection())
        {
            var command = new CommandDefinition(sql, mediaItem, cancellationToken: cancellationToken);
            await connection.ExecuteAsync(command);
        }
    }

    public async Task<bool> UpdateAsync(MediaItem mediaItem, CancellationToken cancellationToken = default)
    {
        const string sql = @"
            UPDATE MediaItems
            SET Title = @Title,
                Artist = @Artist,
                FilePath = @FilePath,
                MediaType = @MediaType,
                DurationSeconds = @DurationSeconds,
                OwnerId = @OwnerId
            WHERE Id = @Id";

        using (var connection = _connectionFactory.CreateConnection())
        {
            var command = new CommandDefinition(sql, mediaItem, cancellationToken: cancellationToken);
            var affectedRows = await connection.ExecuteAsync(command);

            if (affectedRows > 0)
            {
                return true;
            }
            else
            {
                return false;
            }
        }
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        const string sql = "DELETE FROM MediaItems WHERE Id = @Id";

        using (var connection = _connectionFactory.CreateConnection())
        {
            var parameters = new { Id = id };
            var command = new CommandDefinition(sql, parameters, cancellationToken: cancellationToken);
            var affectedRows = await connection.ExecuteAsync(command);

            if (affectedRows > 0)
            {
                return true;
            }
            else
            {
                return false;
            }
        }
    }
}
