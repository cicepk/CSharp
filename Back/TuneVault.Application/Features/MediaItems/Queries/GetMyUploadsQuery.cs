using MediatR;
using TuneVault.Application.DTOs.Media;

namespace TuneVault.Application.Features.MediaItems.Queries;

public class GetMyUploadsQuery : IRequest<List<MediaDto>>
{
    public Guid CurrentUserId { get; set; }
    public string BaseUrl { get; set; } = string.Empty;
}
