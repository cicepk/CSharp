using MediatR;
using TuneVault.Application.DTOs.Playlist;
using TuneVault.Application.Interfaces;

namespace TuneVault.Application.Features.Playlist.Queries;

public class GetMyPlaylistsHandler : IRequestHandler<GetMyPlaylistsQuery, List<PlaylistDto>>
{
    private readonly IPlaylistRepository _playlistRepository;

    public GetMyPlaylistsHandler(IPlaylistRepository playlistRepository)
    {
        _playlistRepository = playlistRepository;
    }

    public async Task<List<PlaylistDto>> Handle(GetMyPlaylistsQuery request, CancellationToken cancellationToken)
    {
        var playlists = await _playlistRepository.GetByUserIdAsync(request.UserId, cancellationToken);
        var dtos = new List<PlaylistDto>();

        foreach (var p in playlists)
        {
            var tracks   = await _playlistRepository.GetPlaylistTracksAsync(p.Id, cancellationToken);
            var firstCover = tracks.FirstOrDefault()?.CoverPath;
            dtos.Add(new PlaylistDto
            {
                Id         = p.Id,
                Name       = p.Name,
                IsPublic   = p.isPublic,
                OwnerId    = p.OwnerId,
                TrackCount = tracks.Count,
                CoverUrl   = firstCover != null ? $"{request.BaseUrl}{firstCover}" : null,
                CreatedAt  = p.CreatedAt
            });
        }

        return dtos;
    }
}
