using MediatR;

namespace TuneVault.Application.Features.Notification.Queries;

public class GetUnreadCountQuery : IRequest<int>
{
    public Guid UserId { get; set; }
}
