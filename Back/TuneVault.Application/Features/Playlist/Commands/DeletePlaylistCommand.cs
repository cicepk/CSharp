using MediatR;

namespace TuneVault.Application.Features.Playlist.Commands;

public class DeletePlaylistCommand : IRequest<bool>
{
    public Guid PlaylistId    { get; set; }
    public Guid CurrentUserId { get; set; }
}
