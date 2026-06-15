using Dapper;
using TuneVault.Application.Interfaces;
using TuneVault.Domain.Entities;
using TuneVault.Infrastructure.Data;

namespace TuneVault.Infrastructure.Repositories;

public class PlaylistRepository : IPlaylistRepository
{
    private readonly ISqlConnectionFactory _connectionFactory;

    public PlaylistRepository(ISqlConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task<Guid> CreateAsync(Playlist playlist, CancellationToken cancellationToken = default)
    {
        const string sql = @"
            INSERT INTO Playlists (Id, Name, isPublic, CreatedAt, OwnerId)
            VALUES (@Id, @Name, @isPublic, @CreatedAt, @OwnerId)";

        using (var connection = _connectionFactory.CreateConnection())
        {
            var parameters = new
            {
                playlist.Id,
                playlist.Name,
                playlist.isPublic,
                playlist.CreatedAt,
                playlist.OwnerId
            };
            var command = new CommandDefinition(sql, parameters, cancellationToken: cancellationToken);
            await connection.ExecuteAsync(command);
            return playlist.Id;
        }
    }

    public async Task<Playlist?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        const string sql = @"
            SELECT Id, Name, isPublic, CreatedAt, OwnerId
            FROM Playlists
            WHERE Id = @Id";

        using (var connection = _connectionFactory.CreateConnection())
        {
            var parameters = new { Id = id };
            var command = new CommandDefinition(sql, parameters, cancellationToken: cancellationToken);
            var playlist = await connection.QuerySingleOrDefaultAsync<Playlist>(command);
            return playlist;
        }
    }

    public async Task<IReadOnlyList<Playlist>> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        const string sql = @"
            SELECT Id, Name, isPublic, CreatedAt, OwnerId
            FROM Playlists
            WHERE OwnerId = @UserId
            ORDER BY CreatedAt DESC";

        using (var connection = _connectionFactory.CreateConnection())
        {
            var parameters = new { UserId = userId };
            var command = new CommandDefinition(sql, parameters, cancellationToken: cancellationToken);
            var playlists = await connection.QueryAsync<Playlist>(command);
            return playlists.ToList();
        }
    }

    public async Task<bool> UpdateAsync(Playlist playlist, CancellationToken cancellationToken = default)
    {
        const string sql = @"
            UPDATE Playlists
            SET Name = @Name,
                isPublic = @isPublic
            WHERE Id = @Id";

        using (var connection = _connectionFactory.CreateConnection())
        {
            var parameters = new
            {
                playlist.Id,
                playlist.Name,
                playlist.isPublic
            };
            var command = new CommandDefinition(sql, parameters, cancellationToken: cancellationToken);
            var affectedRows = await connection.ExecuteAsync(command);
            return affectedRows > 0;
        }
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        const string sql = "DELETE FROM Playlists WHERE Id = @Id";

        using (var connection = _connectionFactory.CreateConnection())
        {
            var parameters = new { Id = id };
            var command = new CommandDefinition(sql, parameters, cancellationToken: cancellationToken);
            var affectedRows = await connection.ExecuteAsync(command);
            return affectedRows > 0;
        }
    }

    public async Task AddTrackToPlaylistAsync(Guid playlistId, Guid mediaItemId, CancellationToken cancellationToken = default)
    {
        const string sql = @"
            INSERT INTO PlaylistItems (Id, PlaylistId, MediaItemId, AddedAt)
            VALUES (@Id, @PlaylistId, @MediaItemId, @AddedAt)";

        using (var connection = _connectionFactory.CreateConnection())
        {
            var parameters = new
            {
                Id = Guid.NewGuid(),
                PlaylistId = playlistId,
                MediaItemId = mediaItemId,
                AddedAt = DateTime.UtcNow
            };
            var command = new CommandDefinition(sql, parameters, cancellationToken: cancellationToken);
            await connection.ExecuteAsync(command);
        }
    }

    public async Task<bool> RemoveTrackFromPlaylistAsync(Guid playlistId, Guid mediaItemId, CancellationToken cancellationToken = default)
    {
        const string sql = @"
            DELETE FROM PlaylistItems
            WHERE PlaylistId = @PlaylistId AND MediaItemId = @MediaItemId";

        using (var connection = _connectionFactory.CreateConnection())
        {
            var parameters = new { PlaylistId = playlistId, MediaItemId = mediaItemId };
            var command = new CommandDefinition(sql, parameters, cancellationToken: cancellationToken);
            var affectedRows = await connection.ExecuteAsync(command);
            return affectedRows > 0;
        }
    }

    public async Task<IReadOnlyList<MediaItem>> GetPlaylistTracksAsync(Guid playlistId, CancellationToken cancellationToken = default)
    {
        const string sql = @"
            SELECT m.Id, m.Title, m.Artist, m.FilePath, m.CoverPath, m.MediaType, m.DurationSeconds, m.CreatedAt, m.OwnerId
            FROM MediaItems m
            INNER JOIN PlaylistItems pi ON m.Id = pi.MediaItemId
            WHERE pi.PlaylistId = @PlaylistId
            ORDER BY pi.AddedAt DESC";

        using (var connection = _connectionFactory.CreateConnection())
        {
            var parameters = new { PlaylistId = playlistId };
            var command = new CommandDefinition(sql, parameters, cancellationToken: cancellationToken);
            var tracks = await connection.QueryAsync<MediaItem>(command);
            return tracks.ToList();
        }
    }

    public async Task<int> GetPlaylistTracksCountAsync(Guid playlistId, CancellationToken cancellationToken = default)
    {
        const string sql = @"
            SELECT COUNT(*)
            FROM PlaylistItems
            WHERE PlaylistId = @PlaylistId";

        using (var connection = _connectionFactory.CreateConnection())
        {
            var parameters = new { PlaylistId = playlistId };
            var command = new CommandDefinition(sql, parameters, cancellationToken: cancellationToken);
            var count = await connection.QuerySingleAsync<int>(command);
            return count;
        }
    }

    public async Task<IReadOnlyList<Playlist>> GetPublicByUserIdAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        const string sql = @"
            SELECT Id, Name, isPublic, CreatedAt, OwnerId
            FROM Playlists
            WHERE OwnerId = @UserId AND isPublic = 1
            ORDER BY CreatedAt DESC";

        using (var connection = _connectionFactory.CreateConnection())
        {
            var command = new CommandDefinition(sql, new { UserId = userId }, cancellationToken: cancellationToken);
            var playlists = await connection.QueryAsync<Playlist>(command);
            return playlists.ToList();
        }
    }
}
