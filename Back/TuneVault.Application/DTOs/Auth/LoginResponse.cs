namespace TuneVault.Application.DTOs.Auth;

/// <summary>
/// Response sau khi đăng nhập thành công (chứa JWT token)
/// Lưu Token vào localStorage hoặc httpOnly cookie, thêm vào Authorization: Bearer {token}
/// </summary>
public class LoginResponse
{
    // ID của user
    public Guid UserId { get; set; }

    // Tên đăng nhập
    public string Username { get; set; } = string.Empty;

    // Email đã đăng nhập
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// JWT Token - Thêm vào Authorization header cho requests tiếp theo
    /// Format: Authorization: Bearer {token}
    /// </summary>
    public string Token { get; set; } = string.Empty;

    // Thời gian hết hạn token (UTC)
    public DateTime ExpiresAt { get; set; }

    public string Role { get; set; } = "User";
}
