namespace TuneVault.Application.Interfaces;

public interface INotificationPushService
{
    /// <summary>
    /// Push real-time notification tới client qua SignalR.
    /// userId là Guid.ToString() của người nhận.
    /// </summary>
    Task PushAsync(string userId, object payload, CancellationToken cancellationToken = default);
}
