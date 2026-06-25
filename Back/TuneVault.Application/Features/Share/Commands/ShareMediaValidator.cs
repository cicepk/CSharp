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
            .WithMessage("You must select at least a MediaItem or a Playlist to share")
            .Must(x => !(x.MediaItemId.HasValue && x.PlaylistId.HasValue))
            .WithMessage("You cannot share both a MediaItem and a Playlist in a single request");

        RuleFor(x => x.SenderId)
            .NotEmpty().WithMessage("SenderId is required")
            .NotEqual(x => x.ReceiverUserId).WithMessage("You cannot share with yourself");
    }
}
