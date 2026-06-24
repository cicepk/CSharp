using MediatR;
using TuneVault.Application.Interfaces;
using TuneVault.Domain.Entities;

namespace TuneVault.Application.Features.Admin.Queries;

public class GetUserTracksAdminHandler : IRequestHandler<GetUserTracksAdminQuery, List<MediaItem>>
{
    private readonly IMediaItemRepository _mediaItemRepository;

    public GetUserTracksAdminHandler(IMediaItemRepository mediaItemRepository)
    {
        _mediaItemRepository = mediaItemRepository;
    }

    public async Task<List<MediaItem>> Handle(GetUserTracksAdminQuery request, CancellationToken cancellationToken)
    {
        var tracks = await _mediaItemRepository.GetByOwnerIdAsync(request.UserId, cancellationToken);
        return tracks.ToList();
    }
}
