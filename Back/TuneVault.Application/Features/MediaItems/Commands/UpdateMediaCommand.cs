using MediatR;
using TuneVault.Application.DTOs.Media;

namespace TuneVault.Application.Features.MediaItems.Commands;

public class UpdateMediaCommand : IRequest<MediaDto>
{
    public Guid   Id            { get; set; }
    public Guid   CurrentUserId { get; set; }
    public string Title         { get; set; } = string.Empty;
    public string Artist        { get; set; } = string.Empty;
    public string BaseUrl       { get; set; } = string.Empty;
}
