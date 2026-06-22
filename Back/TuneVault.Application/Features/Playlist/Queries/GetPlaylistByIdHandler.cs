using MediatR;
using TuneVault.Application.DTOs.Media;
using TuneVault.Application.DTOs.Playlist;
using TuneVault.Application.Interfaces;

namespace TuneVault.Application.Features.Playlist.Queries;

public class GetPlaylistByIdHandler : IRequestHandler<GetPlaylistByIdQuery, PlaylistDetailDto>
{
    private readonly IPlaylistRepository _playlistRepository;

    public GetPlaylistByIdHandler(IPlaylistRepository playlistRepository)
    {
        _playlistRepository = playlistRepository;
    }

    public async Task<PlaylistDetailDto> Handle(GetPlaylistByIdQuery request, CancellationToken cancellationToken)
    {
        var playlist = await _playlistRepository.GetByIdAsync(request.PlaylistId, cancellationToken);
        if (playlist == null)
            throw new KeyNotFoundException("Playlist not found");

        if (!playlist.isPublic && playlist.OwnerId != request.CurrentUserId)
            throw new UnauthorizedAccessException();

        var tracks = await _playlistRepository.GetPlaylistTracksAsync(request.PlaylistId, cancellationToken);
        var firstCover = tracks.FirstOrDefault()?.CoverPath;

        var trackDtos = tracks.Select(t => new MediaDto
        {
            Id              = t.Id,
            Title           = t.Title,
            Artist          = t.Artist,
            MediaType       = (int)t.MediaType,
            DurationSeconds = t.DurationSeconds,
            OwnerId         = t.OwnerId,
            FilePath        = $"{request.BaseUrl}/api/mediaitems/{t.Id}/stream",
            CoverPath       = t.CoverPath != null ? (t.CoverPath.StartsWith("http") ? t.CoverPath : $"{request.BaseUrl}{t.CoverPath}") : null,
            CreatedAt       = t.CreatedAt
        }).ToList();

        return new PlaylistDetailDto
        {
            Id         = playlist.Id,
            Name       = playlist.Name,
            IsPublic   = playlist.isPublic,
            OwnerId    = playlist.OwnerId,
            TrackCount = tracks.Count,
            CoverUrl   = firstCover != null ? (firstCover.StartsWith("http") ? firstCover : $"{request.BaseUrl}{firstCover}") : null,
            CreatedAt  = playlist.CreatedAt,
            Tracks     = trackDtos
        };
    }
}
