namespace TuneVault.Application.DTOs.User;

/// <summary>
/// Thông tin user công khai (không có email)
/// GET /users/{id}
/// </summary>
public class UserDto
{
    // ID của user
    public Guid Id { get; set; }

    // Tên đăng nhập
    public string Username { get; set; } = string.Empty;

    // Số lượng người follow user này
    public int FollowerCount { get; set; }

    // Số lượng user này đang follow
    public int FollowingCount { get; set; }

    // Ngày tạo tài khoản (UTC)
    public DateTime CreatedAt { get; set; }
}
