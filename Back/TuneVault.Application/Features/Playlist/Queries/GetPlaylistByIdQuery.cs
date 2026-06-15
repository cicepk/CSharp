using MediatR;
using TuneVault.Application.DTOs.Playlist;

namespace TuneVault.Application.Features.Playlist.Queries;

public class GetPlaylistByIdQuery : IRequest<PlaylistDetailDto>
{
    public Guid   PlaylistId    { get; set; }
    public Guid   CurrentUserId { get; set; }
    public string BaseUrl       { get; set; } = string.Empty;
}
