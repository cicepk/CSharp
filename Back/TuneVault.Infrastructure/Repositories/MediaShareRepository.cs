using Dapper;
using TuneVault.Application.Interfaces;
using TuneVault.Domain.Entities;
using TuneVault.Infrastructure.Data;

namespace TuneVault.Infrastructure.Repositories;

public class MediaShareRepository : IMediaShareRepository
{
    private readonly ISqlConnectionFactory _connectionFactory;

    public MediaShareRepository(ISqlConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task<Guid> CreateAsync(MediaShare share, CancellationToken cancellationToken = default)
    {
        const string sql = @"
            INSERT INTO MediaShares (Id, MediaItemId, PlaylistId, SharedByUserId, SharedToUserId, SharedAt)
            VALUES (@Id, @MediaItemId, @PlaylistId, @SharedByUserId, @SharedToUserId, @SharedAt)";

        using var connection = _connectionFactory.CreateConnection();
        await connection.ExecuteAsync(new CommandDefinition(sql, new
        {
            share.Id,
            share.MediaItemId,
            share.PlaylistId,
            share.SharedByUserId,
            share.SharedToUserId,
            share.SharedAt
        }, cancellationToken: cancellationToken));
        return share.Id;
    }

    public async Task<MediaShare?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        const string sql = @"
            SELECT Id, MediaItemId, PlaylistId, SharedByUserId, SharedToUserId, SharedAt
            FROM MediaShares WHERE Id = @Id";

        using var connection = _connectionFactory.CreateConnection();
        return await connection.QuerySingleOrDefaultAsync<MediaShare>(
            new CommandDefinition(sql, new { Id = id }, cancellationToken: cancellationToken));
    }

    public async Task<IReadOnlyList<MediaShare>> GetSharedWithMeAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        const string sql = @"
            SELECT Id, MediaItemId, PlaylistId, SharedByUserId, SharedToUserId, SharedAt
            FROM MediaShares
            WHERE SharedToUserId = @UserId
            ORDER BY SharedAt DESC";

        using var connection = _connectionFactory.CreateConnection();
        var result = await connection.QueryAsync<MediaShare>(
            new CommandDefinition(sql, new { UserId = userId }, cancellationToken: cancellationToken));
        return result.ToList();
    }

    public async Task<IReadOnlyList<MediaShare>> GetSharedByMeAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        const string sql = @"
            SELECT Id, MediaItemId, PlaylistId, SharedByUserId, SharedToUserId, SharedAt
            FROM MediaShares
            WHERE SharedByUserId = @UserId
            ORDER BY SharedAt DESC";

        using var connection = _connectionFactory.CreateConnection();
        var result = await connection.QueryAsync<MediaShare>(
            new CommandDefinition(sql, new { UserId = userId }, cancellationToken: cancellationToken));
        return result.ToList();
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        const string sql = "DELETE FROM MediaShares WHERE Id = @Id";

        using var connection = _connectionFactory.CreateConnection();
        var rows = await connection.ExecuteAsync(
            new CommandDefinition(sql, new { Id = id }, cancellationToken: cancellationToken));
        return rows > 0;
    }

    public async Task<bool> ExistsAsync(
        Guid senderId, Guid receiverId,
        Guid? mediaItemId, Guid? playlistId,
        CancellationToken cancellationToken = default)
    {
        const string sql = @"
            SELECT COUNT(*)
            FROM MediaShares
            WHERE SharedByUserId = @SenderId
              AND SharedToUserId = @ReceiverId
              AND (@MediaItemId IS NULL OR MediaItemId = @MediaItemId)
              AND (@PlaylistId  IS NULL OR PlaylistId  = @PlaylistId)";

        using var connection = _connectionFactory.CreateConnection();
        var count = await connection.QuerySingleAsync<int>(new CommandDefinition(sql, new
        {
            SenderId    = senderId,
            ReceiverId  = receiverId,
            MediaItemId = mediaItemId,
            PlaylistId  = playlistId
        }, cancellationToken: cancellationToken));
        return count > 0;
    }

    public async Task<bool> MediaItemExistsAsync(Guid mediaItemId, CancellationToken cancellationToken = default)
    {
        const string sql = "SELECT COUNT(*) FROM MediaItems WHERE Id = @MediaItemId";

        using var connection = _connectionFactory.CreateConnection();
        var count = await connection.QuerySingleAsync<int>(
            new CommandDefinition(sql, new { MediaItemId = mediaItemId }, cancellationToken: cancellationToken));
        return count > 0;
    }

    public async Task<bool> PlaylistExistsAsync(Guid playlistId, CancellationToken cancellationToken = default)
    {
        const string sql = "SELECT COUNT(*) FROM Playlists WHERE Id = @PlaylistId";

        using var connection = _connectionFactory.CreateConnection();
        var count = await connection.QuerySingleAsync<int>(
            new CommandDefinition(sql, new { PlaylistId = playlistId }, cancellationToken: cancellationToken));
        return count > 0;
    }

    public async Task<Guid> AddShareAsync(
        Guid senderId, Guid receiverId,
        Guid? mediaItemId, Guid? playlistId,
        CancellationToken cancellationToken = default)
    {
        var share = new MediaShare
        {
            Id             = Guid.NewGuid(),
            MediaItemId    = mediaItemId,
            PlaylistId     = playlistId,
            SharedByUserId = senderId,
            SharedToUserId = receiverId,
            SharedAt       = DateTime.UtcNow
        };
        return await CreateAsync(share, cancellationToken);
    }
}
