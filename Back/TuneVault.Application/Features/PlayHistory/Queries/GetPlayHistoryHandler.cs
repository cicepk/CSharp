using MediatR;
using TuneVault.Application.DTOs.PlayHistory;
using TuneVault.Application.Interfaces;

namespace TuneVault.Application.Features.PlayHistory.Queries;

public class GetPlayHistoryHandler : IRequestHandler<GetPlayHistoryQuery, List<PlayHistoryDto>>
{
    private readonly IPlayHistoryRepository _historyRepository;
    private readonly IMediaItemRepository   _mediaItemRepository;

    public GetPlayHistoryHandler(IPlayHistoryRepository historyRepository, IMediaItemRepository mediaItemRepository)
    {
        _historyRepository   = historyRepository;
        _mediaItemRepository = mediaItemRepository;
    }

    public async Task<List<PlayHistoryDto>> Handle(GetPlayHistoryQuery request, CancellationToken cancellationToken)
    {
        var history = await _historyRepository.GetRecentByUserIdAsync(request.UserId, 10, cancellationToken);
        var dtos    = new List<PlayHistoryDto>();

        foreach (var h in history)
        {
            var media = await _mediaItemRepository.GetByIdAsync(h.MediaItemId, cancellationToken);
            if (media == null) continue;

            dtos.Add(new PlayHistoryDto
            {
                Id          = h.Id,
                MediaItemId = h.MediaItemId,
                Title       = media.Title,
                Artist      = media.Artist,
                StreamUrl   = $"{request.BaseUrl}/api/mediaitems/{media.Id}/stream",
                CoverPath   = media.CoverPath != null ? $"{request.BaseUrl}{media.CoverPath}" : null,
                PlayedAt    = h.PlayedAt
            });
        }

        return dtos;
    }
}
