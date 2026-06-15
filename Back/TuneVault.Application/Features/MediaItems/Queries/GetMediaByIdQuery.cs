using MediatR;
using TuneVault.Application.DTOs.Media;

namespace TuneVault.Application.Features.MediaItems.Queries;

public class GetMediaByIdQuery : IRequest<MediaDto>
{
    public Guid   Id      { get; set; }
    public string BaseUrl { get; set; } = string.Empty;
}
