using MediatR;
using TuneVault.Application.Features.Share;
using TuneVault.Application.Interfaces;

namespace TuneVault.Application.Features.Share.Handlers
{
    public class ShareMediaCommandHandler : IRequestHandler<ShareMediaCommand, Guid>
    {
        private readonly IMediaShareRepository _shareRepository;
        private readonly IUserRepository _userRepository;

        public ShareMediaCommandHandler(
            IMediaShareRepository shareRepository,
            IUserRepository userRepository)
        {
            _shareRepository = shareRepository;
            _userRepository = userRepository;
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

            // 4. Lưu xuống DB
            var shareId = await _shareRepository.AddShareAsync(
                command.SenderId,
                command.ReceiverUserId,
                command.MediaItemId,
                command.PlaylistId,
                cancellationToken);

            return shareId;
        }
    }
}