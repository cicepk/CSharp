using MediatR;
using TuneVault.Application.Interfaces;

namespace TuneVault.Application.Features.Playlist.Commands;

public class DeletePlaylistHandler : IRequestHandler<DeletePlaylistCommand, bool>
{
    private readonly IPlaylistRepository _playlistRepository;

    public DeletePlaylistHandler(IPlaylistRepository playlistRepository)
    {
        _playlistRepository = playlistRepository;
    }

    public async Task<bool> Handle(DeletePlaylistCommand command, CancellationToken cancellationToken)
    {
        var playlist = await _playlistRepository.GetByIdAsync(command.PlaylistId, cancellationToken);
        if (playlist == null)
            throw new KeyNotFoundException("Playlist not found");

        if (playlist.OwnerId != command.CurrentUserId)
            throw new UnauthorizedAccessException();

        await _playlistRepository.DeleteAsync(command.PlaylistId, cancellationToken);
        return true;
    }
}
