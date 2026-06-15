using MediatR;
using TuneVault.Application.Interfaces;

namespace TuneVault.Application.Features.Favourite.Commands;

public class ToggleFavouriteHandler : IRequestHandler<ToggleFavouriteCommand, bool>
{
    private readonly IFavouriteRepository _favouriteRepository;
    private readonly IMediaItemRepository _mediaItemRepository;

    public ToggleFavouriteHandler(IFavouriteRepository favouriteRepository, IMediaItemRepository mediaItemRepository)
    {
        _favouriteRepository = favouriteRepository;
        _mediaItemRepository = mediaItemRepository;
    }

    public async Task<bool> Handle(ToggleFavouriteCommand command, CancellationToken cancellationToken)
    {
        var media = await _mediaItemRepository.GetByIdAsync(command.MediaItemId, cancellationToken);
        if (media == null)
            throw new KeyNotFoundException("Media not found");

        var exists = await _favouriteRepository.ExistsAsync(command.UserId, command.MediaItemId, cancellationToken);

        if (exists)
        {
            await _favouriteRepository.RemoveAsync(command.UserId, command.MediaItemId, cancellationToken);
            return false;
        }
        else
        {
            await _favouriteRepository.AddAsync(command.UserId, command.MediaItemId, cancellationToken);
            return true;
        }
    }
}
