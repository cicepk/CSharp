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

    public async Task<IReadOnlyList<Genre>> GetGenresByMediaItemIdAsync(Guid mediaItemId, CancellationToken cancellationToken = default)
    {
        const string sql = @"
            SELECT g.Id, g.Name, g.Description
            FROM Genres g
            INNER JOIN MediaGenres mg ON g.Id = mg.GenreId
            WHERE mg.MediaItemId = @MediaItemId";

        using (var connection = _connectionFactory.CreateConnection())
        {
            var parameters = new { MediaItemId = mediaItemId };
            var command = new CommandDefinition(sql, parameters, cancellationToken: cancellationToken);
            var genres = await connection.QueryAsync<Genre>(command);
            return genres.ToList();
        }
    }

    public async Task<Genre?> GetGenreByIdAsync(Guid genreId, CancellationToken cancellationToken = default)
    {
        const string sql = @"
            SELECT Id, Name, Description
            FROM Genres
            WHERE Id = @Id";

        using (var connection = _connectionFactory.CreateConnection())
        {
            var parameters = new { Id = genreId };
            var command = new CommandDefinition(sql, parameters, cancellationToken: cancellationToken);
            var genre = await connection.QuerySingleOrDefaultAsync<Genre>(command);
            return genre;
        }
    }

    public async Task AddGenreAsync(Genre genre, CancellationToken cancellationToken = default)
    {
        const string sql = @"
            INSERT INTO Genres (Id, Name, Description)
            VALUES (@Id, @Name, @Description)";

        using (var connection = _connectionFactory.CreateConnection())
        {
            var command = new CommandDefinition(sql, genre, cancellationToken: cancellationToken);
            await connection.ExecuteAsync(command);
        }
    }

    public async Task AddMediaGenreAsync(Guid mediaItemId, Guid genreId, CancellationToken cancellationToken = default)
    {
        const string sql = @"
            INSERT INTO MediaGenres (MediaItemId, GenreId, AddedAt)
            VALUES (@MediaItemId, @GenreId, @AddedAt)";

        using (var connection = _connectionFactory.CreateConnection())
        {
            var parameters = new
            {
                MediaItemId = mediaItemId,
                GenreId = genreId,
                AddedAt = DateTime.UtcNow
            };
            var command = new CommandDefinition(sql, parameters, cancellationToken: cancellationToken);
            await connection.ExecuteAsync(command);
        }
    }

    public async Task<bool> RemoveMediaGenreAsync(Guid mediaItemId, Guid genreId, CancellationToken cancellationToken = default)
    {
        const string sql = @"
            DELETE FROM MediaGenres
            WHERE MediaItemId = @MediaItemId AND GenreId = @GenreId";

        using (var connection = _connectionFactory.CreateConnection())
        {
            var parameters = new { MediaItemId = mediaItemId, GenreId = genreId };
            var command = new CommandDefinition(sql, parameters, cancellationToken: cancellationToken);
            var affectedRows = await connection.ExecuteAsync(command);
            return affectedRows > 0;
        }
    }

    public async Task AddPlayHistoryAsync(PlayHistory playHistory, CancellationToken cancellationToken = default)
    {
        const string sql = @"
            INSERT INTO PlayHistory (Id, UserId, MediaItemId, PlayedAt, DurationSeconds)
            VALUES (@Id, @UserId, @MediaItemId, @PlayedAt, @DurationSeconds)";

        using (var connection = _connectionFactory.CreateConnection())
        {
            var command = new CommandDefinition(sql, playHistory, cancellationToken: cancellationToken);
            await connection.ExecuteAsync(command);
        }
    }

    public async Task<IReadOnlyList<PlayHistory>> GetPlayHistoryByUserIdAsync(Guid userId, int limit = 50, CancellationToken cancellationToken = default)
    {
        const string sql = @"
            SELECT TOP (@Limit) Id, UserId, MediaItemId, PlayedAt, DurationSeconds
            FROM PlayHistory
            WHERE UserId = @UserId
            ORDER BY PlayedAt DESC";

        using (var connection = _connectionFactory.CreateConnection())
        {
            var parameters = new { UserId = userId, Limit = limit };
            var command = new CommandDefinition(sql, parameters, cancellationToken: cancellationToken);
            var playHistory = await connection.QueryAsync<PlayHistory>(command);
            return playHistory.ToList();
        }
    }

    public async Task<IReadOnlyList<PlayHistory>> GetPlayHistoryByMediaItemIdAsync(Guid mediaItemId, int limit = 50, CancellationToken cancellationToken = default)
    {
        const string sql = @"
            SELECT TOP (@Limit) Id, UserId, MediaItemId, PlayedAt, DurationSeconds
            FROM PlayHistory
            WHERE MediaItemId = @MediaItemId
            ORDER BY PlayedAt DESC";

        using (var connection = _connectionFactory.CreateConnection())
        {
            var parameters = new { MediaItemId = mediaItemId, Limit = limit };
            var command = new CommandDefinition(sql, parameters, cancellationToken: cancellationToken);
            var playHistory = await connection.QueryAsync<PlayHistory>(command);
            return playHistory.ToList();
        }
    }
}
