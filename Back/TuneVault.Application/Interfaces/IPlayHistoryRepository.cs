using TuneVault.Domain.Entities;

namespace TuneVault.Application.Interfaces;

public interface IPlayHistoryRepository
{
    Task RecordAsync(Guid userId, Guid mediaItemId, int durationSeconds, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<PlayHistory>> GetRecentByUserIdAsync(Guid userId, int limit = 10, CancellationToken cancellationToken = default);
}
