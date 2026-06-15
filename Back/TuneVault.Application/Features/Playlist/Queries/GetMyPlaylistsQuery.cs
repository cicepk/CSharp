using MediatR;
using TuneVault.Application.DTOs.Playlist;

namespace TuneVault.Application.Features.Playlist.Queries;

public class GetMyPlaylistsQuery : IRequest<List<PlaylistDto>>
{
    public Guid   UserId  { get; set; }
    public string BaseUrl { get; set; } = string.Empty;
}
