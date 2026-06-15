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

        public ShareMediaCommandHandler(
            IMediaShareRepository shareRepository,
            IUserRepository userRepository,
            INotificationRepository notificationRepository,
            INotificationPushService pushService)
        {
            _shareRepository = shareRepository;
            _userRepository = userRepository;
            _notificationRepository = notificationRepository;
            _pushService = pushService;
        }

        public async Task<Guid> Handle(ShareMediaCommand command, CancellationToken cancellationToken)
        {
            // 0. Input Validation
            if (command.SenderId == command.ReceiverUserId)
                throw new ArgumentException("Bạn không thể tự chia sẻ cho chính mình.");

            if (!command.MediaItemId.HasValue && !command.PlaylistId.HasValue)
                throw new ArgumentException("Phải chọn ít nhất một Bài hát hoặc một Playlist để chia sẻ.");

            if (command.MediaItemId.HasValue && command.PlaylistId.HasValue)
                throw new ArgumentException("Không thể chia sẻ đồng thời cả Bài hát và Playlist trong một yêu cầu.");

            // 1. Receiver phải tồn tại
            var receiverExists = await _userRepository.ExistsAsync(command.ReceiverUserId, cancellationToken);
            if (!receiverExists)
                throw new KeyNotFoundException($"Người dùng nhận (Id: {command.ReceiverUserId}) không tồn tại.");

            // 2. Kiểm tra media hoặc playlist tồn tại
            if (command.MediaItemId.HasValue)
            {
                var mediaExists = await _shareRepository.MediaItemExistsAsync(command.MediaItemId.Value, cancellationToken);
                if (!mediaExists)
                    throw new KeyNotFoundException($"Bài hát/media (Id: {command.MediaItemId}) không tồn tại.");
            }
            else if (command.PlaylistId.HasValue)
            {
                var playlistExists = await _shareRepository.PlaylistExistsAsync(command.PlaylistId.Value, cancellationToken);
                if (!playlistExists)
                    throw new KeyNotFoundException($"Playlist (Id: {command.PlaylistId}) không tồn tại.");
            }

            // 3. Kiểm tra đã chia sẻ trùng chưa
            var alreadyShared = await _shareRepository.ExistsAsync(
                command.SenderId,
                command.ReceiverUserId,
                command.MediaItemId,
                command.PlaylistId,
                cancellationToken);

            if (alreadyShared)
                throw new InvalidOperationException("Nội dung này đã được chia sẻ đến người dùng đó trước đó.");

            // 4. Lưu share xuống DB
            var shareId = await _shareRepository.AddShareAsync(
                command.SenderId,
                command.ReceiverUserId,
                command.MediaItemId,
                command.PlaylistId,
                cancellationToken);

            // 5. Tạo notification trong DB
            var sender = await _userRepository.GetByIdAsync(command.SenderId, cancellationToken);
            var senderName = sender?.UserName ?? "Ai đó";
            var target = command.MediaItemId.HasValue ? "một bài hát" : "một playlist";

            var notification = new DomainNotification
            {
                Id        = Guid.NewGuid(),
                UserId    = command.ReceiverUserId,
                Type      = NotificationType.Shared,
                Message   = $"{senderName} đã chia sẻ {target} với bạn",
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