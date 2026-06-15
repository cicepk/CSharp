using MediatR;
using TuneVault.Application.DTOs.Notification;

namespace TuneVault.Application.Features.Notification.Queries;

public class GetNotificationsQuery : IRequest<List<NotificationDto>>
{
    public Guid UserId     { get; set; }
    public bool UnreadOnly { get; set; }
}
