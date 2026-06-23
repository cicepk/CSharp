using MediatR;
using TuneVault.Application.DTOs.Media;
using TuneVault.Application.Interfaces;

namespace TuneVault.Application.Features.MediaItems.Queries;

public class SearchMediaHandler : IRequestHandler<SearchMediaQuery, List<MediaDto>>
{
    private readonly IMediaItemRepository _mediaItemRepository;

    public SearchMediaHandler(IMediaItemRepository mediaItemRepository)
    {
        _mediaItemRepository = mediaItemRepository;
    }

    public async Task<List<MediaDto>> Handle(SearchMediaQuery request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Q))
            throw new ArgumentException("Search query is required");

        var all   = await _mediaItemRepository.GetAllAsync(cancellationToken);
        var lower = request.Q.ToLowerInvariant();

        return all
            .Where(x => x.Title.ToLowerInvariant().Contains(lower) || x.Artist.ToLowerInvariant().Contains(lower))
            .Select(item => new MediaDto
            {
                Id              = item.Id,
                Title           = item.Title,
                Artist          = item.Artist,
                MediaType       = (int)item.MediaType,
                DurationSeconds = item.DurationSeconds,
                OwnerId         = item.OwnerId,
                OwnerUsername   = item.OwnerUsername,
                FilePath        = $"{request.BaseUrl}/api/mediaitems/{item.Id}/stream",
                CoverPath       = item.CoverPath != null ? (item.CoverPath.StartsWith("http") ? item.CoverPath : $"{request.BaseUrl}{item.CoverPath}") : null,
                CreatedAt       = item.CreatedAt
            })
            .ToList();
    }
}
