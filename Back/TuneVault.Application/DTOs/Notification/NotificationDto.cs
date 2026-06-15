namespace TuneVault.Application.DTOs.Notification;

/// <summary>
/// Thông báo cho user (share, follow, ...)
/// GET /notifications, WebSocket/SignalR (real-time)
/// Frontend: show "{SenderUsername} {Message}", click navigate to TargetId
/// </summary>
public class NotificationDto
{
    // ID của notification
    public Guid Id { get; set; }
    // Loại notification: 1 = Share, 2 = Follow
    public int Type { get; set; }

    /// <summary>
    /// Nội dung thông báo (ví dụ: "đã chia sẻ một bài hát cho bạn")
    /// Frontend ghép: "{SenderUsername} {Message}"
    /// </summary>
    public string Message { get; set; } = string.Empty;

    // Tên user gửi thông báo (để frontend hiển thị)
    public string SenderUsername { get; set; } = string.Empty;

    /// <summary>
    /// ID của bài hát/playlist được tương tác (nullable)
    /// Frontend click → navigate /media/{TargetId} or /playlist/{TargetId}
    /// </summary>
    public Guid? TargetId { get; set; }

    // true = đã đọc, false = chưa đọc
    public bool IsRead { get; set; }

    // Thời gian tạo thông báo (UTC)
    public DateTime CreatedAt { get; set; }
}
