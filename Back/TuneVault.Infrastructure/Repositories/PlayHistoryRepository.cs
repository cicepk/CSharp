using Dapper;
using TuneVault.Application.Interfaces;
using TuneVault.Domain.Entities;
using TuneVault.Infrastructure.Data;

namespace TuneVault.Infrastructure.Repositories;

public class PlayHistoryRepository : IPlayHistoryRepository
{
    private readonly ISqlConnectionFactory _connectionFactory;

    public PlayHistoryRepository(ISqlConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task RecordAsync(Guid userId, Guid mediaItemId, int durationSeconds, CancellationToken cancellationToken = default)
    {
        const string sql = @"
            INSERT INTO PlayHistory (Id, UserId, MediaItemId, PlayedAt, DurationSeconds)
            VALUES (@Id, @UserId, @MediaItemId, @PlayedAt, @DurationSeconds)";

        using var connection = _connectionFactory.CreateConnection();
        var command = new CommandDefinition(sql, new
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            MediaItemId = mediaItemId,
            PlayedAt = DateTime.UtcNow,
            DurationSeconds = durationSeconds
        }, cancellationToken: cancellationToken);
        await connection.ExecuteAsync(command);
    }

    public async Task<IReadOnlyList<PlayHistory>> GetRecentByUserIdAsync(Guid userId, int limit = 10, CancellationToken cancellationToken = default)
    {
        const string sql = @"
            SELECT TOP (@Limit) ph.Id, ph.UserId, ph.MediaItemId, ph.PlayedAt, ph.DurationSeconds
            FROM PlayHistory ph
            WHERE ph.UserId = @UserId
            ORDER BY ph.PlayedAt DESC";

        using var connection = _connectionFactory.CreateConnection();
        var command = new CommandDefinition(sql, new { UserId = userId, Limit = limit }, cancellationToken: cancellationToken);
        var rows = await connection.QueryAsync<PlayHistory>(command);
        return rows.ToList();
    }
}
