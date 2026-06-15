using MediatR;
using TuneVault.Application.DTOs.Favourite;
using TuneVault.Application.Interfaces;

namespace TuneVault.Application.Features.Favourite.Queries;

public class GetFavouritesHandler : IRequestHandler<GetFavouritesQuery, List<FavouriteDto>>
{
    private readonly IFavouriteRepository _favouriteRepository;

    public GetFavouritesHandler(IFavouriteRepository favouriteRepository)
    {
        _favouriteRepository = favouriteRepository;
    }

    public async Task<List<FavouriteDto>> Handle(GetFavouritesQuery request, CancellationToken cancellationToken)
    {
        var items = await _favouriteRepository.GetByUserIdAsync(request.UserId, 100, cancellationToken);

        return items.Select(m => new FavouriteDto
        {
            MediaItemId = m.Id,
            Title       = m.Title,
            Artist      = m.Artist,
            AddedAt     = DateTime.UtcNow
        }).ToList();
    }
}
