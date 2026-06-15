using MediatR;
using TuneVault.Application.Interfaces;

namespace TuneVault.Application.Features.Notification.Commands;

public class MarkAsReadHandler : IRequestHandler<MarkAsReadCommand, bool>
{
    private readonly INotificationRepository _notificationRepository;

    public MarkAsReadHandler(INotificationRepository notificationRepository)
    {
        _notificationRepository = notificationRepository;
    }

    public async Task<bool> Handle(MarkAsReadCommand command, CancellationToken cancellationToken)
    {
        var notification = await _notificationRepository.GetByIdAsync(command.NotificationId, cancellationToken);
        if (notification == null)
            throw new KeyNotFoundException("Notification not found");

        if (notification.UserId != command.CurrentUserId)
            throw new UnauthorizedAccessException();

        await _notificationRepository.MarkAsReadAsync(command.NotificationId, cancellationToken);
        return true;
    }
}
