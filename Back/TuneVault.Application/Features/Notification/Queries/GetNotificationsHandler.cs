using MediatR;
using TuneVault.Application.DTOs.Notification;
using TuneVault.Application.Interfaces;

namespace TuneVault.Application.Features.Notification.Queries;

public class GetNotificationsHandler : IRequestHandler<GetNotificationsQuery, List<NotificationDto>>
{
    private readonly INotificationRepository _notificationRepository;

    public GetNotificationsHandler(INotificationRepository notificationRepository)
    {
        _notificationRepository = notificationRepository;
    }

    public async Task<List<NotificationDto>> Handle(GetNotificationsQuery request, CancellationToken cancellationToken)
    {
        var notifications = await _notificationRepository.GetByUserIdAsync(request.UserId, request.UnreadOnly, cancellationToken);

        return notifications.Select(n => new NotificationDto
        {
            Id             = n.Id,
            Type           = (int)n.Type,
            Message        = n.Message,
            SenderUsername = string.Empty,
            TargetId       = null,
            IsRead         = n.IsRead,
            CreatedAt      = n.CreatedAt
        }).ToList();
    }
}
