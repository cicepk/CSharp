using MediatR;
using TuneVault.Application.DTOs.Media;
using TuneVault.Application.Interfaces;

namespace TuneVault.Application.Features.MediaItems.Queries;

public class GetMyUploadsHandler : IRequestHandler<GetMyUploadsQuery, List<MediaDto>>
{
    private readonly IMediaItemRepository _mediaItemRepository;

    public GetMyUploadsHandler(IMediaItemRepository mediaItemRepository)
    {
        _mediaItemRepository = mediaItemRepository;
    }

    public async Task<List<MediaDto>> Handle(GetMyUploadsQuery request, CancellationToken cancellationToken)
    {
        var items = await _mediaItemRepository.GetByOwnerIdAsync(request.CurrentUserId, cancellationToken);
        return items.Select(item => new MediaDto
        {
            Id              = item.Id,
            Title           = item.Title,
            Artist          = item.Artist,
            MediaType       = (int)item.MediaType,
            DurationSeconds = item.DurationSeconds,
            OwnerId         = item.OwnerId,
            FilePath        = $"{request.BaseUrl}/api/mediaitems/{item.Id}/stream",
            CoverPath       = item.CoverPath != null ? $"{request.BaseUrl}{item.CoverPath}" : null,
            CreatedAt       = item.CreatedAt
        }).ToList();
    }
}
