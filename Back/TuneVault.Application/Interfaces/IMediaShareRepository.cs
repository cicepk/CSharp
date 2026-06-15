using TuneVault.Domain.Entities;

namespace TuneVault.Application.Interfaces;

public interface IMediaShareRepository
{
    Task<Guid> CreateAsync(MediaShare share, CancellationToken cancellationToken = default);
    Task<MediaShare?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<MediaShare>> GetSharedWithMeAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<MediaShare>> GetSharedByMeAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default);

    // Kiểm tra trùng — signature khớp với handler
    Task<bool> ExistsAsync(Guid senderId, Guid receiverId, Guid? mediaItemId, Guid? playlistId, CancellationToken cancellationToken = default);

    // Kiểm tra media/playlist tồn tại
    Task<bool> MediaItemExistsAsync(Guid mediaItemId, CancellationToken cancellationToken = default);
    Task<bool> PlaylistExistsAsync(Guid playlistId, CancellationToken cancellationToken = default);

    // Lưu share — wrap CreateAsync bên trong
    Task<Guid> AddShareAsync(Guid senderId, Guid receiverId, Guid? mediaItemId, Guid? playlistId, CancellationToken cancellationToken = default);
}