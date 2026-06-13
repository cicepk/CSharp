namespace TuneVault.Application.DTOs.Playlist;

/// <summary>
/// Thông tin playlist (không chứa danh sách tracks)
/// Dùng khi show danh sách playlists
/// </summary>
/// <remarks>
/// Được trả từ: GET /playlists
/// </remarks>
public class PlaylistDto
{
    // ID của playlist
    public Guid Id { get; set; }
    // Tên playlist
    public string Name { get; set; } = string.Empty;
    //Là playlist công khai hay riêng tư
    public bool IsPublic { get; set; }
    // ID của chủ sở hữu playlist
    public Guid OwnerId { get; set; }
    // Số lượng bài hát trong playlist
    public int TrackCount { get; set; }
    // Ảnh bìa playlist (lấy từ track đầu tiên)
    public string? CoverUrl { get; set; }
    // Ngày tạo playlist (UTC)
    public DateTime CreatedAt { get; set; }
}
