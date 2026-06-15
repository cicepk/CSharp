namespace TuneVault.Application.DTOs.User;

public class UserSearchResultDto
{
    public Guid    Id        { get; set; }
    public string  Username  { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public string? Bio       { get; set; }
}
