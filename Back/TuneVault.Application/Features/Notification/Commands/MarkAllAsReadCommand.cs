using MediatR;

namespace TuneVault.Application.Features.Notification.Commands;

public class MarkAllAsReadCommand : IRequest<int>
{
    public Guid UserId { get; set; }
}
