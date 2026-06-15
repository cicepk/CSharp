using MediatR;
using TuneVault.Application.DTOs.Playlist;
using TuneVault.Application.Interfaces;
using TuneVault.Domain.Entities;

namespace TuneVault.Application.Features.Playlist.Commands;

public class CreatePlaylistHandler : IRequestHandler<CreatePlaylistCommand, PlaylistDto>
{
    private readonly IPlaylistRepository _playlistRepository;

    public CreatePlaylistHandler(IPlaylistRepository playlistRepository)
    {
        _playlistRepository = playlistRepository;
    }

    public async Task<PlaylistDto> Handle(CreatePlaylistCommand command, CancellationToken cancellationToken)
    {
        var playlist = new Domain.Entities.Playlist
        {
            Id        = Guid.NewGuid(),
            Name      = command.Name,
            isPublic  = command.IsPublic,
            OwnerId   = command.OwnerId,
            CreatedAt = DateTime.UtcNow
        };

        var newId = await _playlistRepository.CreateAsync(playlist, cancellationToken);
        playlist.Id = newId;

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
