using MediatR;
using TuneVault.Application.DTOs.Playlist;
using TuneVault.Application.Interfaces;

namespace TuneVault.Application.Features.Playlist.Commands;

public class UpdatePlaylistHandler : IRequestHandler<UpdatePlaylistCommand, PlaylistDto>
{
    private readonly IPlaylistRepository _playlistRepository;

    public UpdatePlaylistHandler(IPlaylistRepository playlistRepository)
    {
        _playlistRepository = playlistRepository;
    }

    public async Task<PlaylistDto> Handle(UpdatePlaylistCommand command, CancellationToken cancellationToken)
    {
        var playlist = await _playlistRepository.GetByIdAsync(command.PlaylistId, cancellationToken);
        if (playlist == null)
            throw new KeyNotFoundException("Playlist not found");

        if (playlist.OwnerId != command.CurrentUserId)
            throw new UnauthorizedAccessException();

        playlist.Name     = command.Name;
        playlist.isPublic = command.IsPublic;

        await _playlistRepository.UpdateAsync(playlist, cancellationToken);

        return new PlaylistDto
        {
            Id         = playlist.Id,
            Name       = playlist.Name,
            IsPublic   = playlist.isPublic,
            OwnerId    = playlist.OwnerId,
            TrackCount = 0,
            CoverUrl   = null,
            CreatedAt  = playlist.CreatedAt
        };
    }
}
