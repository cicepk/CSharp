using TuneVault.Domain.Entities;

namespace TuneVault.Application.Interfaces;

public interface IMediaItemRepository
{
    Task<IReadOnlyList<MediaItem>> GetAllAsync(CancellationToken cancellationToken = default);

    Task<MediaItem?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task AddAsync(MediaItem mediaItem, CancellationToken cancellationToken = default);

    // Tra ve true neu co ban ghi bi cap nhat, false neu khong tim thay Id.
    Task<bool> UpdateAsync(MediaItem mediaItem, CancellationToken cancellationToken = default);

    // Tra ve true neu co ban ghi bi xoa, false neu khong tim thay Id.
    Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}
