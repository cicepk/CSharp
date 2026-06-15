using MediatR;
using TuneVault.Application.Interfaces;

namespace TuneVault.Application.Features.Notification.Commands;

public class DeleteNotificationHandler : IRequestHandler<DeleteNotificationCommand, bool>
{
    private readonly INotificationRepository _notificationRepository;

    public DeleteNotificationHandler(INotificationRepository notificationRepository)
    {
        _notificationRepository = notificationRepository;
    }

    public async Task<bool> Handle(DeleteNotificationCommand command, CancellationToken cancellationToken)
    {
        var notification = await _notificationRepository.GetByIdAsync(command.NotificationId, cancellationToken);
        if (notification == null)
            throw new KeyNotFoundException("Notification not found");

        if (notification.UserId != command.CurrentUserId)
            throw new UnauthorizedAccessException();

        await _notificationRepository.DeleteAsync(command.NotificationId, cancellationToken);
        return true;
    }
}
