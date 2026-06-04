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
            INSERT INTO MediaShares (Id, MediaItemId, SharedByUserId, SharedToUserId, SharedAt)
            VALUES (@Id, @MediaItemId, @SharedByUserId, @SharedToUserId, @SharedAt)";

        using (var connection = _connectionFactory.CreateConnection())
        {
            var parameters = new
            {
                share.Id,
                share.MediaItemId,
                share.SharedByUserId,
                share.SharedToUserId,
                share.SharedAt
            };
            var command = new CommandDefinition(sql, parameters, cancellationToken: cancellationToken);
            await connection.ExecuteAsync(command);
            return share.Id;
        }
    }

    public async Task<MediaShare?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        const string sql = @"
            SELECT Id, MediaItemId, SharedByUserId, SharedToUserId, SharedAt
            FROM MediaShares
            WHERE Id = @Id";

        using (var connection = _connectionFactory.CreateConnection())
        {
            var parameters = new { Id = id };
            var command = new CommandDefinition(sql, parameters, cancellationToken: cancellationToken);
            var share = await connection.QuerySingleOrDefaultAsync<MediaShare>(command);
            return share;
        }
    }

    public async Task<IReadOnlyList<MediaShare>> GetSharedWithMeAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        const string sql = @"
            SELECT Id, MediaItemId, SharedByUserId, SharedToUserId, SharedAt
            FROM MediaShares
            WHERE SharedToUserId = @UserId
            ORDER BY SharedAt DESC";

        using (var connection = _connectionFactory.CreateConnection())
        {
            var parameters = new { UserId = userId };
            var command = new CommandDefinition(sql, parameters, cancellationToken: cancellationToken);
            var shares = await connection.QueryAsync<MediaShare>(command);
            return shares.ToList();
        }
    }

    public async Task<IReadOnlyList<MediaShare>> GetSharedByMeAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        const string sql = @"
            SELECT Id, MediaItemId, SharedByUserId, SharedToUserId, SharedAt
            FROM MediaShares
            WHERE SharedByUserId = @UserId
            ORDER BY SharedAt DESC";

        using (var connection = _connectionFactory.CreateConnection())
        {
            var parameters = new { UserId = userId };
            var command = new CommandDefinition(sql, parameters, cancellationToken: cancellationToken);
            var shares = await connection.QueryAsync<MediaShare>(command);
            return shares.ToList();
        }
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        const string sql = "DELETE FROM MediaShares WHERE Id = @Id";

        using (var connection = _connectionFactory.CreateConnection())
        {
            var parameters = new { Id = id };
            var command = new CommandDefinition(sql, parameters, cancellationToken: cancellationToken);
            var affectedRows = await connection.ExecuteAsync(command);
            return affectedRows > 0;
        }
    }

    public async Task<bool> ExistsAsync(Guid mediaItemId, Guid sharedByUserId, Guid sharedToUserId, CancellationToken cancellationToken = default)
    {
        const string sql = @"
            SELECT COUNT(*)
            FROM MediaShares
            WHERE MediaItemId = @MediaItemId
            AND SharedByUserId = @SharedByUserId
            AND SharedToUserId = @SharedToUserId";

        using (var connection = _connectionFactory.CreateConnection())
        {
            var parameters = new
            {
                MediaItemId = mediaItemId,
                SharedByUserId = sharedByUserId,
                SharedToUserId = sharedToUserId
            };
            var command = new CommandDefinition(sql, parameters, cancellationToken: cancellationToken);
            var count = await connection.QuerySingleAsync<int>(command);
            return count > 0;
        }
    }
}
