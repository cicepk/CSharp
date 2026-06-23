namespace TuneVault.Application.DTOs.Media;

/// <summary>
/// Upload file audio hoặc video
/// POST /media/upload (require auth, multipart/form-data)
/// Allowed: Audio (.mp3, .wav, .flac, .m4a), Video (.mp4, .webm, .mkv)
/// File size: 1MB - 500MB
/// </summary>
public class UploadMediaRequest
{
    // Tên bài hát/video (1-200 ký tự)
    public string Title { get; set; } = string.Empty;

    // Tên ca sĩ/tác giả (1-200 ký tự)
    public string Artist { get; set; } = string.Empty;

    // Loại media: 1 = Audio, 2 = Video
    public int MediaType { get; set; }

    // Danh sách genre IDs (optional, tối đa 3)
    public List<Guid> GenreIds { get; set; } = new();
}
