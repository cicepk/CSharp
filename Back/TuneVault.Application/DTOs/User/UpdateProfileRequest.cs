namespace TuneVault.Application.DTOs.User;

/// <summary>
/// Cập nhật hồ sơ user (username, email)
/// PUT /users/profile (require auth)
/// </summary>
public class UpdateProfileRequest
{
    // Tên đăng nhập mới (unique)
    public string Username { get; set; } = string.Empty;

    // Email mới (unique, valid email)
    public string Email { get; set; } = string.Empty;
}
