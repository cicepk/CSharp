using MediatR;
using TuneVault.Application.DTOs.Media;

namespace TuneVault.Application.Features.MediaItems.Queries;

public class SearchMediaQuery : IRequest<List<MediaDto>>
{
    public string Q       { get; set; } = string.Empty;
    public string BaseUrl { get; set; } = string.Empty;
}
