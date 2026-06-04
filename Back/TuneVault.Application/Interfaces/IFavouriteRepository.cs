using TuneVault.Domain.Entities;

namespace TuneVault.Application.Interfaces;

public interface IFavouriteRepository
{
    Task AddAsync(Guid userId, Guid mediaItemId, CancellationToken cancellationToken = default);

    Task<bool> RemoveAsync(Guid userId, Guid mediaItemId, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<MediaItem>> GetByUserIdAsync(Guid userId, int limit = 50, CancellationToken cancellationToken = default);

    Task<bool> ExistsAsync(Guid userId, Guid mediaItemId, CancellationToken cancellationToken = default);

    Task<int> GetCountByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);
}
