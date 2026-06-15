using MediatR;
using TuneVault.Application.Interfaces;

namespace TuneVault.Application.Features.Playlist.Commands;

public class RemoveTrackHandler : IRequestHandler<RemoveTrackCommand, bool>
{
    private readonly IPlaylistRepository _playlistRepository;

    public RemoveTrackHandler(IPlaylistRepository playlistRepository)
    {
        _playlistRepository = playlistRepository;
    }

    public async Task<bool> Handle(RemoveTrackCommand command, CancellationToken cancellationToken)
    {
        var playlist = await _playlistRepository.GetByIdAsync(command.PlaylistId, cancellationToken);
        if (playlist == null)
            throw new KeyNotFoundException("Playlist not found");

        if (playlist.OwnerId != command.CurrentUserId)
            throw new UnauthorizedAccessException();

        var removed = await _playlistRepository.RemoveTrackFromPlaylistAsync(command.PlaylistId, command.MediaItemId, cancellationToken);
        if (!removed)
            throw new KeyNotFoundException("Track not in playlist");

        return true;
    }
}
