using MediatR;
using TuneVault.Application.Features.Share.Commands;
using TuneVault.Application.Interfaces;
using TuneVault.Domain.Enums;
using DomainNotification = TuneVault.Domain.Entities.Notification;

namespace TuneVault.Application.Features.Share.Commands
{
    public class ShareMediaCommandHandler : IRequestHandler<ShareMediaCommand, Guid>
    {
        private readonly IMediaShareRepository _shareRepository;
        private readonly IUserRepository _userRepository;
        private readonly INotificationRepository _notificationRepository;
        private readonly INotificationPushService _pushService;
        private readonly IMediaItemRepository _mediaItemRepository;
        private readonly IPlaylistRepository _playlistRepository;

        public ShareMediaCommandHandler(
            IMediaShareRepository shareRepository,
            IUserRepository userRepository,
            INotificationRepository notificationRepository,
            INotificationPushService pushService,
            IMediaItemRepository mediaItemRepository,
            IPlaylistRepository playlistRepository)
        {
            _shareRepository = shareRepository;
            _userRepository = userRepository;
            _notificationRepository = notificationRepository;
            _pushService = pushService;
            _mediaItemRepository = mediaItemRepository;
            _playlistRepository = playlistRepository;
        }

        public async Task<Guid> Handle(ShareMediaCommand command, CancellationToken cancellationToken)
        {
            // 0. Input Validation
            if (command.SenderId == command.ReceiverUserId)
                throw new ArgumentException("You cannot share with yourself.");

            if (!command.MediaItemId.HasValue && !command.PlaylistId.HasValue)
                throw new ArgumentException("You must select at least a track or a playlist to share.");

            if (command.MediaItemId.HasValue && command.PlaylistId.HasValue)
                throw new ArgumentException("You cannot share both a track and a playlist in a single request.");

            // 1. Receiver phải tồn tại
            var receiverExists = await _userRepository.ExistsAsync(command.ReceiverUserId, cancellationToken);
            if (!receiverExists)
                throw new KeyNotFoundException($"Receiver (Id: {command.ReceiverUserId}) does not exist.");

            // 2. Kiểm tra media hoặc playlist tồn tại
            if (command.MediaItemId.HasValue)
            {
                var mediaExists = await _shareRepository.MediaItemExistsAsync(command.MediaItemId.Value, cancellationToken);
                if (!mediaExists)
                    throw new KeyNotFoundException($"Media item (Id: {command.MediaItemId}) does not exist.");
            }
            else if (command.PlaylistId.HasValue)
            {
                var playlistExists = await _shareRepository.PlaylistExistsAsync(command.PlaylistId.Value, cancellationToken);
                if (!playlistExists)
                    throw new KeyNotFoundException($"Playlist (Id: {command.PlaylistId}) does not exist.");
            }

            // 3. Kiểm tra đã chia sẻ trùng chưa
            var alreadyShared = await _shareRepository.ExistsAsync(
                command.SenderId,
                command.ReceiverUserId,
                command.MediaItemId,
                command.PlaylistId,
                cancellationToken);

            if (alreadyShared)
                throw new InvalidOperationException("This content has already been shared with that user.");

            // 4. Lưu share xuống DB
            var shareId = await _shareRepository.AddShareAsync(
                command.SenderId,
                command.ReceiverUserId,
                command.MediaItemId,
                command.PlaylistId,
                cancellationToken);

            // 5. Tạo notification trong DB
            var sender = await _userRepository.GetByIdAsync(command.SenderId, cancellationToken);
            var senderName = sender?.UserName ?? "Someone";
            string target;
            if (command.MediaItemId.HasValue)
            {
                var media = await _mediaItemRepository.GetByIdAsync(command.MediaItemId.Value, cancellationToken);
                target = media != null ? $"\"{media.Title}\"" : "a track";
            }
            else
            {
                var playlist = await _playlistRepository.GetByIdAsync(command.PlaylistId!.Value, cancellationToken);
                target = playlist != null ? $"playlist \"{playlist.Name}\"" : "a playlist";
            }

            var notification = new DomainNotification
            {
                Id        = Guid.NewGuid(),
                UserId    = command.ReceiverUserId,
                Type      = NotificationType.Shared,
                Message   = $"{senderName} shared {target} with you",
                IsRead    = false,
                CreatedAt = DateTime.UtcNow
            };
            await _notificationRepository.CreateAsync(notification, cancellationToken);

            // 6. Push real-time qua SignalR
            await _pushService.PushAsync(
                command.ReceiverUserId.ToString(),
                new
                {
                    id        = notification.Id,
                    type      = (int)notification.Type,
                    message   = notification.Message,
                    isRead    = false,
                    createdAt = notification.CreatedAt
                },
                cancellationToken);

            return shareId;
        }
    }
}