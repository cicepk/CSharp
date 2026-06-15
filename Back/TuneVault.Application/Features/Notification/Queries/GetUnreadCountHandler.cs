using MediatR;
using TuneVault.Application.Interfaces;

namespace TuneVault.Application.Features.Notification.Queries;

public class GetUnreadCountHandler : IRequestHandler<GetUnreadCountQuery, int>
{
    private readonly INotificationRepository _notificationRepository;

    public GetUnreadCountHandler(INotificationRepository notificationRepository)
    {
        _notificationRepository = notificationRepository;
    }

    public async Task<int> Handle(GetUnreadCountQuery request, CancellationToken cancellationToken)
    {
        return await _notificationRepository.GetUnreadCountAsync(request.UserId, cancellationToken);
    }
}
