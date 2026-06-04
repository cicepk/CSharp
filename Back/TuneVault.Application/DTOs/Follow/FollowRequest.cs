namespace TuneVault.Application.DTOs.Follow;

/// <summary>
/// Follow/Unfollow (toggle) một user
/// POST /users/{userId}/follow (follow), DELETE /users/{userId}/follow (unfollow)
/// </summary>
public class FollowRequest
{
    // ID của user cần follow/unfollow
    public Guid UserId { get; set; }
}
