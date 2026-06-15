using MediatR;
using TuneVault.Application.Interfaces;

namespace TuneVault.Application.Features.Playlist.Commands;

public class ToggleVisibilityHandler : IRequestHandler<ToggleVisibilityCommand, bool>
{
    private readonly IPlaylistRepository _playlistRepository;

    public ToggleVisibilityHandler(IPlaylistRepository playlistRepository)
    {
        _playlistRepository = playlistRepository;
    }

    public async Task<bool> Handle(ToggleVisibilityCommand command, CancellationToken cancellationToken)
    {
        var playlist = await _playlistRepository.GetByIdAsync(command.PlaylistId, cancellationToken);
        if (playlist == null)
            throw new KeyNotFoundException("Playlist not found");

        if (playlist.OwnerId != command.CurrentUserId)
            throw new UnauthorizedAccessException();

        playlist.isPublic = command.IsPublic;
        await _playlistRepository.UpdateAsync(playlist, cancellationToken);
        return command.IsPublic;
    }
}
