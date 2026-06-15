using MediatR;

namespace TuneVault.Application.Features.Playlist.Commands;

public class RemoveTrackCommand : IRequest<bool>
{
    public Guid PlaylistId    { get; set; }
    public Guid CurrentUserId { get; set; }
    public Guid MediaItemId   { get; set; }
}
