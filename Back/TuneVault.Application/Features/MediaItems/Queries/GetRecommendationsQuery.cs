using MediatR;
using TuneVault.Application.DTOs.Media;

namespace TuneVault.Application.Features.MediaItems.Queries;

public class GetRecommendationsQuery : IRequest<List<MediaDto>>
{
    public Guid   UserId  { get; set; }
    public string BaseUrl { get; set; } = string.Empty;
}
