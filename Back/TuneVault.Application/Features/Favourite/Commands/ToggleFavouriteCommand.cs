using MediatR;

namespace TuneVault.Application.Features.Favourite.Commands;

public class ToggleFavouriteCommand : IRequest<bool>
{
    public Guid UserId      { get; set; }
    public Guid MediaItemId { get; set; }
}
