using FluentValidation;

namespace TuneVault.Application.Features.MediaItems.Commands;

public class UploadMediaValidator : AbstractValidator<UploadMediaCommand>
{
    public UploadMediaValidator()
    {
        RuleFor(x => x.Title).NotEmpty().WithMessage("Title is required");
        RuleFor(x => x.Artist).NotEmpty().WithMessage("Artist is required");
        RuleFor(x => x.MediaType).InclusiveBetween(1, 2).WithMessage("MediaType must be 1 (Audio) or 2 (Video)");
        RuleFor(x => x.FilePath).NotEmpty().WithMessage("FilePath is required");
    }
}
