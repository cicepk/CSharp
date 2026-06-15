using MediatR;
using TuneVault.Application.Interfaces;

namespace TuneVault.Application.Features.Favourite.Queries;

public class GetFavouriteStatusHandler : IRequestHandler<GetFavouriteStatusQuery, bool>
{
    private readonly IFavouriteRepository _favouriteRepository;

    public GetFavouriteStatusHandler(IFavouriteRepository favouriteRepository)
    {
        _favouriteRepository = favouriteRepository;
    }

    public async Task<bool> Handle(GetFavouriteStatusQuery request, CancellationToken cancellationToken)
    {
        return await _favouriteRepository.ExistsAsync(request.UserId, request.MediaItemId, cancellationToken);
    }
}
