using MediatR;
using TuneVault.Application.DTOs.Media;

namespace TuneVault.Application.Features.MediaItems.Commands;

public class UploadMediaCommand : IRequest<MediaDto>
{
    public string  Title     { get; set; } = string.Empty;
    public string  Artist    { get; set; } = string.Empty;
    public int     MediaType { get; set; }
    public string  FilePath  { get; set; } = string.Empty;
    public string? CoverPath { get; set; }
    public Guid    OwnerId   { get; set; }
    public string  BaseUrl   { get; set; } = string.Empty;
}
