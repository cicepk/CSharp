namespace TuneVault.Application.DTOs.Share;

/// <summary>
/// Chia sẻ bài hát hoặc playlist cho user khác
/// </summary>
/// <remarks>
/// Frontend gọi: POST /share/{mediaId} hoặc POST /share?mediaId=...
/// Header: Authorization: Bearer {token}
/// Body: { "receiverUserId": "550e8400-e29b-41d4-a716-446655440000", "mediaItemId": "...", "playlistId": null }
///
/// Validation Rules:
/// - Phải có ÍT NHẤT 1 trong 2: mediaItemId hoặc playlistId (không được null cả 2)
/// - mediaItemId và playlistId không được cùng có giá trị (chỉ 1 cái)
/// - receiverUserId không được bằng id của user đang share
/// - receiverUserId phải tồn tại trong database
/// </remarks>
public class ShareMediaRequest
{
    // ID của user nhận (người được chia sẻ)
    public Guid ReceiverUserId { get; set; }
    // 1 trong 2: ID bài hát hoặc playlist cần chia sẻ
    // ID của bài hát cần chia sẻ
    public Guid? MediaItemId { get; set; }
    // ID của playlist cần chia sẻ
    public Guid? PlaylistId { get; set; }
}
