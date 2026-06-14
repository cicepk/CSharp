namespace TuneVault.Application.DTOs.Playlist;

/// <summary>
/// Cập nhật thông tin playlist
/// PUT /playlists/{playlistId} (require auth)
/// </summary>
public class UpdatePlaylistRequest
{
    public string Name { get; set; } = string.Empty;
    public bool IsPublic { get; set; }
}
