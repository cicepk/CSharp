using MediatR;
using TuneVault.Application.DTOs.Admin;
using TuneVault.Application.Interfaces;

namespace TuneVault.Application.Features.Admin.Queries;

public class GetUserTracksAdminHandler : IRequestHandler<GetUserTracksAdminQuery, List<AdminTrackDto>>
{
    private readonly IMediaItemRepository _mediaItemRepository;

    public GetUserTracksAdminHandler(IMediaItemRepository mediaItemRepository)
    {
        _mediaItemRepository = mediaItemRepository;
    }

    public async Task<List<AdminTrackDto>> Handle(GetUserTracksAdminQuery request, CancellationToken cancellationToken)
    {
        var tracks = await _mediaItemRepository.GetByOwnerIdAsync(request.UserId, cancellationToken);

        return tracks.Select(t => new AdminTrackDto
        {
            Id = t.Id,
            Title = t.Title,
            Artist = t.Artist,
            MediaType = (int)t.MediaType,
            DurationSeconds = t.DurationSeconds,
            CoverPath = t.CoverPath != null
                ? (t.CoverPath.StartsWith("http") ? t.CoverPath : $"{request.BaseUrl}{t.CoverPath}")
                : null,
            CreatedAt = t.CreatedAt
        }).ToList();
    }
}
