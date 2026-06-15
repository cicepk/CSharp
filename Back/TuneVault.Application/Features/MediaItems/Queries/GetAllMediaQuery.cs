using MediatR;
using TuneVault.Application.DTOs.Media;

namespace TuneVault.Application.Features.MediaItems.Queries;

public class GetAllMediaQuery : IRequest<List<MediaDto>>
{
    public string BaseUrl { get; set; } = string.Empty;
}
