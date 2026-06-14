using Microsoft.AspNetCore.SignalR;
using TuneVault.API.Hubs;
using TuneVault.Application.Interfaces;

namespace TuneVault.API.Services;

//IHubContext<NotificationHub> phụ thuộc vào Hub trong API layer
public class SignalRNotificationService : INotificationPushService
{
    private readonly IHubContext<NotificationHub> _hubContext;

    public SignalRNotificationService(IHubContext<NotificationHub> hubContext)
    {
        _hubContext = hubContext;
    }

    public async Task PushAsync(string userId, object payload, CancellationToken cancellationToken = default)
    {
        await _hubContext.Clients.User(userId)
            .SendAsync("ReceiveNotification", payload, cancellationToken);
    }
}
