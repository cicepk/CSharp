namespace TuneVault.Application.DTOs.Media;

/// <summary>
/// Thông tin bài hát hoặc video
/// GET /media, GET /media/{id}, GET /playlists/{id}, GET /favorites
/// </summary>
public class MediaDto
{
    // ID của media item
    public Guid Id { get; set; }

    // Tên bài hát hoặc video
    public string Title { get; set; } = string.Empty;

    // Tên ca sĩ hoặc tác giả
    public string Artist { get; set; } = string.Empty;

    // Loại media: 1 = Audio, 2 = Video
    public int MediaType { get; set; }

    /// <summary>
    /// Độ dài bài hát (tính bằng giây)
    /// Frontend dùng để format HH:MM:SS
    /// </summary>
    public int DurationSeconds { get; set; }

    // ID của chủ sở hữu (người upload)
    public Guid OwnerId { get; set; }

    /// <summary>
    /// URL để stream/download file (/api/media/{id}/stream)
    /// Frontend set vào <audio src> hoặc <video src>
    /// </summary>
    public string FilePath { get; set; } = string.Empty;

    // Ngày upload (UTC)
    public DateTime CreatedAt { get; set; }
}
