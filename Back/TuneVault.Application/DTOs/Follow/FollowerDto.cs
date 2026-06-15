namespace TuneVault.Application.DTOs.Follow;

/// <summary>
/// Thông tin user trong danh sách followers/following (no email - public info)
/// GET /users/{userId}/followers, GET /users/{userId}/following
/// </summary>
public class FollowerDto
{
    // ID của user
    public Guid Id { get; set; }

    // Tên đăng nhập
    public string Username { get; set; } = string.Empty;
}
