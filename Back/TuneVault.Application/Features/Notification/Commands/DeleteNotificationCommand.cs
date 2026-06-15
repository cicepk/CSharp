using MediatR;

namespace TuneVault.Application.Features.Notification.Commands;

public class DeleteNotificationCommand : IRequest<bool>
{
    public Guid NotificationId { get; set; }
    public Guid CurrentUserId  { get; set; }
}
