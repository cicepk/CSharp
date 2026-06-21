using MediatR;
using TuneVault.Application.DTOs.Media;
using TuneVault.Application.Interfaces;

namespace TuneVault.Application.Features.MediaItems.Queries;

public class GetAllMediaHandler : IRequestHandler<GetAllMediaQuery, List<MediaDto>>
{
    private readonly IMediaItemRepository _mediaItemRepository;

    public GetAllMediaHandler(IMediaItemRepository mediaItemRepository)
    {
        _mediaItemRepository = mediaItemRepository;
    }

    public async Task<List<MediaDto>> Handle(GetAllMediaQuery request, CancellationToken cancellationToken)
    {
        var items = await _mediaItemRepository.GetAllAsync(cancellationToken);
        return items.Select(item => new MediaDto
        {
            Id              = item.Id,
            Title           = item.Title,
            Artist          = item.Artist,
            MediaType       = (int)item.MediaType,
            DurationSeconds = item.DurationSeconds,
            OwnerId         = item.OwnerId,
            FilePath        = $"{request.BaseUrl}/api/mediaitems/{item.Id}/stream",
            CoverPath       = item.CoverPath != null ? (item.CoverPath.StartsWith("http") ? item.CoverPath : $"{request.BaseUrl}{item.CoverPath}") : null,
            CreatedAt       = item.CreatedAt
        }).ToList();
    }
}
