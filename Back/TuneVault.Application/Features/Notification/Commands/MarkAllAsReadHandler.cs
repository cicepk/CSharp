using MediatR;
using TuneVault.Application.Interfaces;

namespace TuneVault.Application.Features.Notification.Commands;

public class MarkAllAsReadHandler : IRequestHandler<MarkAllAsReadCommand, int>
{
    private readonly INotificationRepository _notificationRepository;

    public MarkAllAsReadHandler(INotificationRepository notificationRepository)
    {
        _notificationRepository = notificationRepository;
    }

    public async Task<int> Handle(MarkAllAsReadCommand command, CancellationToken cancellationToken)
    {
        return await _notificationRepository.MarkAllAsReadAsync(command.UserId, cancellationToken);
    }
}
