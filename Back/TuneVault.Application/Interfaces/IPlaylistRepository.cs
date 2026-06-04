using TuneVault.Domain.Entities;

namespace TuneVault.Application.Interfaces;

public interface IPlaylistRepository
{
    Task<Guid> CreateAsync(Playlist playlist, CancellationToken cancellationToken = default);

    Task<Playlist?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    // lay tat ca playlist cua user
    Task<IReadOnlyList<Playlist>> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);

    Task<bool> UpdateAsync(Playlist playlist, CancellationToken cancellationToken = default);

    Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default);

    Task AddTrackToPlaylistAsync(Guid playlistId, Guid mediaItemId, CancellationToken cancellationToken = default);

    Task<bool> RemoveTrackFromPlaylistAsync(Guid playlistId, Guid mediaItemId, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<MediaItem>> GetPlaylistTracksAsync(Guid playlistId, CancellationToken cancellationToken = default);

    Task<int> GetPlaylistTracksCountAsync(Guid playlistId, CancellationToken cancellationToken = default);
}
