using MediatR;

namespace TuneVault.Application.Features.User.Commands;

public class UploadAvatarCommand : IRequest<string>
{
    public Guid UserId { get; set; }

    // Avatar source + metadata (controller only reads IFormFile, handler saves)
    public Stream FileStream { get; set; } = Stream.Null;
    public string FileName { get; set; } = string.Empty;
    public long FileSizeBytes { get; set; }
}
