using FluentValidation;

namespace TuneVault.Application.Features.User.Commands;

public class UploadAvatarValidator : AbstractValidator<UploadAvatarCommand>
{
    private static readonly string[] AllowedExtensions = [".jpg", ".jpeg", ".png", ".webp"];
    private const long MaxFileSizeBytes = 5L * 1024 * 1024;

    public UploadAvatarValidator()
    {
        RuleFor(x => x.FileName)
            .NotEmpty().WithMessage("No file provided");

        When(x => !string.IsNullOrEmpty(x.FileName), () =>
        {
            RuleFor(x => x.FileName)
                .Must(name => AllowedExtensions.Contains(Path.GetExtension(name).ToLowerInvariant()))
                .WithMessage("Only JPG, PNG, WebP images are allowed");

            RuleFor(x => x.FileSizeBytes)
                .LessThanOrEqualTo(MaxFileSizeBytes).WithMessage("File size must be under 5MB");
        });
    }
}
