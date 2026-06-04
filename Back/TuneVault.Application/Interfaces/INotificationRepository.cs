using TuneVault.Domain.Entities;

namespace TuneVault.Application.Interfaces;

public interface INotificationRepository
{
    Task<Guid> CreateAsync(Notification notification, CancellationToken cancellationToken = default);

    Task<Notification?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    // lay tat ca thong bao cua user, neu unreadOnly = true thi chi lay thong bao chua doc
    Task<IReadOnlyList<Notification>> GetByUserIdAsync(Guid userId, bool unreadOnly = false, CancellationToken cancellationToken = default);
    
    Task<bool> MarkAsReadAsync(Guid id, CancellationToken cancellationToken = default);

    Task<int> MarkAllAsReadAsync(Guid userId, CancellationToken cancellationToken = default);

    Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default);

    Task<int> GetUnreadCountAsync(Guid userId, CancellationToken cancellationToken = default);
}
