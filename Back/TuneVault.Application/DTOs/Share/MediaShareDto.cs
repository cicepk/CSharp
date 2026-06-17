namespace TuneVault.Application.DTOs.Share;

/// <summary>
/// Thông tin khi bài hát hoặc playlist được chia sẻ
/// GET /share/inbox, GET /share/sent, POST /share
/// </summary>
public class MediaShareDto
{
    // ID của share record
    public Guid Id { get; set; }

    // ID của bài hát được chia sẻ (nullable nếu chia sẻ playlist)
    public Guid? MediaItemId { get; set; }

    // ID của playlist được chia sẻ (nullable nếu chia sẻ bài hát)
    public Guid? PlaylistId { get; set; }

    // ID của user chia sẻ
    public Guid SharedByUserId { get; set; }

    // Tên user chia sẻ (để frontend hiển thị)
    public string SharedByUsername { get; set; } = string.Empty;

    // ID của user nhận (người được chia sẻ)
    public Guid SharedToUserId { get; set; }

    // Tên user nhận (để frontend hiển thị)
    public string SharedToUsername { get; set; } = string.Empty;

    // Thời gian chia sẻ (UTC)
    public DateTime SharedAt { get; set; }
}
