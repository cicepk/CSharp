using MediatR;
using TuneVault.Application.DTOs.Playlist;

namespace TuneVault.Application.Features.Playlist.Commands;

public class CreatePlaylistCommand : IRequest<PlaylistDto>
{
    public string Name     { get; set; } = string.Empty;
    public bool   IsPublic { get; set; }
    public Guid   OwnerId  { get; set; }
}
