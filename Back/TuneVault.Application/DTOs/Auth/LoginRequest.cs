namespace TuneVault.Application.DTOs.Auth;

/// <summary>
/// Đăng nhập (lấy JWT token)
/// POST /auth/login
/// </summary>
public class LoginRequest
{
    // Email đăng nhập
    public string Email { get; set; } = string.Empty;

    // Mật khẩu
    public string Password { get; set; } = string.Empty;
}
