using TuneVault.Domain.Entities;

namespace TuneVault.Application.Interfaces;

public interface IMediaShareRepository
{
    // tao record chia se media item tu user A sang user B, tra ve Id cua record vua tao
    Task<Guid> CreateAsync(MediaShare share, CancellationToken cancellationToken = default);

    Task<MediaShare?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    // lay dsach chia se ma user la nguoi nhan (sharedToUserId)
    Task<IReadOnlyList<MediaShare>> GetSharedWithMeAsync(Guid userId, CancellationToken cancellationToken = default);
    // lay dsach chia se ma user la nguoi chia se (sharedByUserId)
    Task<IReadOnlyList<MediaShare>> GetSharedByMeAsync(Guid userId, CancellationToken cancellationToken = default);

    Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default);

    Task<bool> ExistsAsync(Guid mediaItemId, Guid sharedByUserId, Guid sharedToUserId, CancellationToken cancellationToken = default);
}
