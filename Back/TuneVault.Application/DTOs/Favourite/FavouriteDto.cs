namespace TuneVault.Application.DTOs.Favourite;

/// <summary>
/// Thông tin bài hát trong danh sách yêu thích
/// GET /favorites
/// </summary>
public class FavouriteDto
{
    // ID của bài hát
    public Guid MediaItemId { get; set; }

    // Tên bài hát
    public string Title { get; set; } = string.Empty;

    // Tên ca sĩ
    public string Artist { get; set; } = string.Empty;

    // Thời gian thêm vào yêu thích (UTC)
    public DateTime AddedAt { get; set; }
}
