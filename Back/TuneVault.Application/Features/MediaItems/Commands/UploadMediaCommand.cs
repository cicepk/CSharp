using MediatR;
using TuneVault.Application.DTOs.Media;

namespace TuneVault.Application.Features.MediaItems.Commands;

public class UploadMediaCommand : IRequest<MediaDto>
{
    public string Title { get; set; } = string.Empty;
    public string Artist { get; set; } = string.Empty;
    public int MediaType { get; set; }

    //file + metadata (controller only reads IFormFile, handler saves)
    public Stream FileStream { get; set; } = Stream.Null;
    public string FileName { get; set; } = string.Empty;
    public long FileSizeBytes { get; set; }

    public Stream? CoverStream { get; set; }
    public string? CoverFileName { get; set; }
    public long CoverSizeBytes { get; set; }

    public Guid OwnerId { get; set; }
    public string BaseUrl { get; set; } = string.Empty;
    public int DurationSeconds { get; set; }
    public List<Guid> GenreIds { get; set; } = new();
}
