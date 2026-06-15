namespace TuneVault.Application.DTOs.User;

/// <summary>
/// Thông tin user chi tiết (có email)
/// GET /users/profile (current user - require auth)
/// </summary>
public class UserDetailDto
{
    // ID của user
    public Guid Id { get; set; }

    // Tên đăng nhập
    public string Username { get; set; } = string.Empty;

    // Email (chỉ trả khi user xem profile của chính mình)
    public string Email { get; set; } = string.Empty;

    // Số lượng người follow user này
    public int FollowerCount { get; set; }

    // Số lượng user này đang follow
    public int FollowingCount { get; set; }

    public string? Bio { get; set; }
    public string? AvatarUrl { get; set; }

    // Ngày tạo tài khoản (UTC)
    public DateTime CreatedAt { get; set; }
}
