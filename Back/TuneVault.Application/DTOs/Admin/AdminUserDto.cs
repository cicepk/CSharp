namespace TuneVault.Application.DTOs.Admin;

public class AdminUserDto
{
    public Guid Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = "User";
    public int UploadCount { get; set; }
    public DateTime CreatedAt { get; set; }
}
