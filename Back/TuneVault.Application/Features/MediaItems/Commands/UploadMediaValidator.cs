using FluentValidation;

namespace TuneVault.Application.Features.MediaItems.Commands;

public class UploadMediaValidator : AbstractValidator<UploadMediaCommand>
{
    private static readonly string[] AllowedAudioExtensions = [".mp3", ".wav", ".flac", ".m4a"];
    private static readonly string[] AllowedVideoExtensions = [".mp4", ".webm", ".mkv"];
    private static readonly string[] AllowedCoverExtensions = [".jpg", ".jpeg", ".png", ".webp"];
    private const long MaxFileSizeBytes = 500L * 1024 * 1024;
    private const long MinFileSizeBytes = 1L * 1024;
    private const long MaxCoverSizeBytes = 5L * 1024 * 1024;

    public UploadMediaValidator()
    {
        RuleFor(x => x.Title).NotEmpty().WithMessage("Title is required");
        RuleFor(x => x.Artist).NotEmpty().WithMessage("Artist is required");
        RuleFor(x => x.MediaType).InclusiveBetween(1, 2).WithMessage("MediaType must be 1 (Audio) or 2 (Video)");

        RuleFor(x => x.FileName)
            .NotEmpty().WithMessage("File is required");

        When(x => !string.IsNullOrEmpty(x.FileName), () =>
        {
            RuleFor(x => x.FileSizeBytes)
                .GreaterThanOrEqualTo(MinFileSizeBytes).WithMessage("File too small (min 1KB)")
                .LessThanOrEqualTo(MaxFileSizeBytes).WithMessage("File too large (max 500MB)");

            RuleFor(x => x.FileName)
                .Must(IsSupportedMediaFile)
                .WithMessage(x => $"Unsupported file type '{GetExtension(x.FileName)}'");

            RuleFor(x => x)
                .Must(x => MediaTypeMatchesExtension(x.MediaType, x.FileName))
                .When(x => IsSupportedMediaFile(x.FileName) && (x.MediaType == 1 || x.MediaType == 2))
                .WithMessage(x => x.MediaType == 1
                    ? "File extension does not match Audio type"
                    : "File extension does not match Video type");
        });

        When(x => x.CoverFileName != null, () =>
        {
            RuleFor(x => x.CoverFileName!)
                .Must(name => AllowedCoverExtensions.Contains(GetExtension(name)))
                .WithMessage("Cover must be JPG, PNG or WebP");

            RuleFor(x => x.CoverSizeBytes)
                .LessThanOrEqualTo(MaxCoverSizeBytes).WithMessage("Cover image must be under 5MB");
        });
    }

    private static string GetExtension(string fileName) => Path.GetExtension(fileName).ToLowerInvariant();

    private static bool IsSupportedMediaFile(string fileName)
    {
        var ext = GetExtension(fileName);
        return AllowedAudioExtensions.Contains(ext) || AllowedVideoExtensions.Contains(ext);
    }

    private static bool MediaTypeMatchesExtension(int mediaType, string fileName)
    {
        var ext = GetExtension(fileName);
        return mediaType == 1
            ? AllowedAudioExtensions.Contains(ext)
            : AllowedVideoExtensions.Contains(ext);
    }
}
