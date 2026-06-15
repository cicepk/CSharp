using MediatR;
using TuneVault.Application.DTOs.Playlist;

namespace TuneVault.Application.Features.Playlist.Commands;

public class UpdatePlaylistCommand : IRequest<PlaylistDto>
{
    public Guid   PlaylistId    { get; set; }
    public Guid   CurrentUserId { get; set; }
    public string Name          { get; set; } = string.Empty;
    public bool   IsPublic      { get; set; }
}
