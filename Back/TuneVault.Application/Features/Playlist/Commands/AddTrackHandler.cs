using MediatR;
using TuneVault.Application.Interfaces;

namespace TuneVault.Application.Features.Playlist.Commands;

public class AddTrackHandler : IRequestHandler<AddTrackCommand, bool>
{
    private readonly IPlaylistRepository  _playlistRepository;
    private readonly IMediaItemRepository _mediaItemRepository;

    public AddTrackHandler(IPlaylistRepository playlistRepository, IMediaItemRepository mediaItemRepository)
    {
        _playlistRepository  = playlistRepository;
        _mediaItemRepository = mediaItemRepository;
    }

    public async Task<bool> Handle(AddTrackCommand command, CancellationToken cancellationToken)
    {
        var playlist = await _playlistRepository.GetByIdAsync(command.PlaylistId, cancellationToken);
        if (playlist == null)
            throw new KeyNotFoundException("Playlist not found");

        if (playlist.OwnerId != command.CurrentUserId)
            throw new UnauthorizedAccessException();

        var media = await _mediaItemRepository.GetByIdAsync(command.MediaItemId, cancellationToken);
        if (media == null)
            throw new KeyNotFoundException("Media item not found");

        await _playlistRepository.AddTrackToPlaylistAsync(command.PlaylistId, command.MediaItemId, cancellationToken);
        return true;
    }
}
