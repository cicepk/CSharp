namespace TuneVault.Application.DTOs.Playlist;

/// <summary>
/// Tạo playlist mới
/// POST /playlists (require auth)
/// </summary>
public class CreatePlaylistRequest
{
    // Tên playlist (1-100 ký tự)
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Playlist công khai (true) hay riêng tư (false)
    /// true = người khác có thể tìm thấy, false = chỉ mình tôi thấy
    /// </summary>
    public bool IsPublic { get; set; } = false;
}
