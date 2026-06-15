using MediatR;

namespace TuneVault.Application.Features.Playlist.Commands;

public class ToggleVisibilityCommand : IRequest<bool>
{
    public Guid PlaylistId    { get; set; }
    public Guid CurrentUserId { get; set; }
    public bool IsPublic      { get; set; }
}
