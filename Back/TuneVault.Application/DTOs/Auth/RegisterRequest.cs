namespace TuneVault.Application.DTOs.Auth;

/// <summary>
/// Đăng ký tài khoản mới
/// POST /auth/register
/// </summary>
public class RegisterRequest
{
    // Tên đăng nhập (unique, 3-50 ký tự)
    public string Username { get; set; } = string.Empty;

    // Email (unique, valid email format)
    public string Email { get; set; } = string.Empty;

    // Mật khẩu (tối thiểu 8 ký tự, 1 chữ hoa, 1 số)
    public string Password { get; set; } = string.Empty;
}
