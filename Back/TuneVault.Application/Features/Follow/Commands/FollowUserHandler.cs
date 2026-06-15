using MediatR;
using TuneVault.Application.Interfaces;
using TuneVault.Domain.Enums;
using DomainNotification = TuneVault.Domain.Entities.Notification;

namespace TuneVault.Application.Features.Follow.Commands;

public class FollowUserHandler : IRequestHandler<FollowUserCommand, bool>
{
    private readonly IFollowRepository        _followRepository;
    private readonly IUserRepository          _userRepository;
    private readonly INotificationRepository  _notificationRepository;
    private readonly INotificationPushService _pushService;

    public FollowUserHandler(
        IFollowRepository followRepository,
        IUserRepository userRepository,
        INotificationRepository notificationRepository,
        INotificationPushService pushService)
    {
        _followRepository       = followRepository;
        _userRepository         = userRepository;
        _notificationRepository = notificationRepository;
        _pushService            = pushService;
    }

    public async Task<bool> Handle(FollowUserCommand command, CancellationToken cancellationToken)
    {
        if (command.FollowerId == command.TargetUserId)
            throw new ArgumentException("Cannot follow yourself");

        var target = await _userRepository.GetByIdAsync(command.TargetUserId, cancellationToken);
        if (target == null)
            throw new KeyNotFoundException("User not found");

        var alreadyFollowing = await _followRepository.IsFollowingAsync(command.FollowerId, command.TargetUserId, cancellationToken);
        if (alreadyFollowing)
            throw new InvalidOperationException("Already following this user");

        await _followRepository.FollowAsync(command.FollowerId, command.TargetUserId, cancellationToken);

        var follower = await _userRepository.GetByIdAsync(command.FollowerId, cancellationToken);
        var notification = new DomainNotification
        {
            Id        = Guid.NewGuid(),
            UserId    = command.TargetUserId,
            Type      = NotificationType.Followed,
            Message   = $"{follower?.UserName ?? "Someone"} is now following you",
            IsRead    = false,
            CreatedAt = DateTime.UtcNow
        };
        await _notificationRepository.CreateAsync(notification, cancellationToken);

        await _pushService.PushAsync(
            command.TargetUserId.ToString(),
            new
            {
                id        = notification.Id,
                type      = (int)notification.Type,
                message   = notification.Message,
                isRead    = false,
                createdAt = notification.CreatedAt
            },
            cancellationToken);

        return true;
    }
}
