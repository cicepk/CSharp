using MediatR;

namespace TuneVault.Application.Features.Favourite.Queries;

public class GetFavouriteStatusQuery : IRequest<bool>
{
    public Guid UserId      { get; set; }
    public Guid MediaItemId { get; set; }
}
