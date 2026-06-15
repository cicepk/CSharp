using TuneVault.Domain.Entities;

namespace TuneVault.Application.Interfaces;

public interface IMediaItemRepository
{
    Task<IReadOnlyList<MediaItem>> GetAllAsync(CancellationToken cancellationToken = default);

    Task<MediaItem?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<MediaItem>> GetByOwnerIdAsync(Guid ownerId, CancellationToken cancellationToken = default);

    Task AddAsync(MediaItem mediaItem, CancellationToken cancellationToken = default);

    // Tra ve true neu co ban ghi bi cap nhat, false neu khong tim thay Id.
    Task<bool> UpdateAsync(MediaItem mediaItem, CancellationToken cancellationToken = default);

    // Tra ve true neu co ban ghi bi xoa, false neu khong tim thay Id.
    Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default);

    // Genre
    Task<IReadOnlyList<Genre>> GetGenresByMediaItemIdAsync(Guid mediaItemId, CancellationToken cancellationToken = default);
    Task<Genre?> GetGenreByIdAsync(Guid genreId, CancellationToken cancellationToken = default);
    Task AddGenreAsync(Genre genre, CancellationToken cancellationToken = default);

    // MediaGenre
    Task AddMediaGenreAsync(Guid mediaItemId, Guid genreId, CancellationToken cancellationToken = default);
    Task<bool> RemoveMediaGenreAsync(Guid mediaItemId, Guid genreId, CancellationToken cancellationToken = default);

    // PlayHistory
    Task AddPlayHistoryAsync(PlayHistory playHistory, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<PlayHistory>> GetPlayHistoryByUserIdAsync(Guid userId, int limit = 50, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<PlayHistory>> GetPlayHistoryByMediaItemIdAsync(Guid mediaItemId, int limit = 50, CancellationToken cancellationToken = default);
}
