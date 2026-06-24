using FluentValidation;

namespace TuneVault.Application.Features.Share.Commands;

public class ShareMediaValidator : AbstractValidator<ShareMediaCommand>
{
    public ShareMediaValidator()
    {
        RuleFor(x => x.ReceiverUserId)
            .NotEmpty().WithMessage("ReceiverUserId is required");

        RuleFor(x => x)
            .Must(x => x.MediaItemId.HasValue || x.PlaylistId.HasValue)
            .WithMessage("Phải chọn ít nhất một MediaItem hoặc Playlist để chia sẻ")
            .Must(x => !(x.MediaItemId.HasValue && x.PlaylistId.HasValue))
            .WithMessage("Không thể chia sẻ đồng thời cả MediaItem và Playlist trong một yêu cầu");

        RuleFor(x => x.SenderId)
            .NotEmpty().WithMessage("SenderId is required")
            .NotEqual(x => x.ReceiverUserId).WithMessage("Không thể tự chia sẻ cho chính mình");
    }
}
