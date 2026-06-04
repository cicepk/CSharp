namespace TuneVault.Application.DTOs.Playlist;

/// <summary>
/// Cập nhật thông tin playlist
/// PUT /playlists/{playlistId} (require auth)
/// </summary>
public class UpdatePlaylistRequest
{
    // Tên playlist mới
    public string Name { get; set; } = string.Empty;

    // Trạng thái công khai/riêng tư
    public bool IsPublic { get; set; }
}
