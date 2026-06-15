namespace TuneVault.Application.DTOs.Playlist;

using TuneVault.Application.DTOs.Media;

/// <summary>
/// Thông tin playlist chi tiết (chứa danh sách tracks)
/// Dùng khi mở chi tiết 1 playlist
/// Được trả từ: GET /playlists/{playlistId}
/// Kế thừa từ PlaylistDto + thêm danh sách tracks
/// </summary>
public class PlaylistDetailDto : PlaylistDto
{
    // Danh sách bài hát trong playlist
    public List<MediaDto> Tracks { get; set; } = new List<MediaDto>();
}

