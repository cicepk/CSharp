namespace TuneVault.Application.DTOs.Playlist;

/// <summary>
/// Thêm bài hát vào playlist
/// </summary>
/// <remarks>
/// Frontend gọi: POST /playlists/{playlistId}/tracks
/// Header: Authorization: Bearer {token}
/// Body: { "mediaItemId": "550e8400-e29b-41d4-a716-446655440000" }
/// </remarks>
public class AddTrackToPlaylistRequest
{

    // ID của bài hát cần thêm vào playlist

    public Guid MediaItemId { get; set; }
}
