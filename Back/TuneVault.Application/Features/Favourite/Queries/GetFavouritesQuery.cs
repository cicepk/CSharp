using MediatR;
using TuneVault.Application.DTOs.Favourite;

namespace TuneVault.Application.Features.Favourite.Queries;

public class GetFavouritesQuery : IRequest<List<FavouriteDto>>
{
    public Guid UserId { get; set; }
}
