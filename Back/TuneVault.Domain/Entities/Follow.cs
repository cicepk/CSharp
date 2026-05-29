namespace TuneVault.Domain.Entities;

public class Follow
{
    public Guid Id {get; set;} = Guid.NewGuid();
    public string FollowerId {get; set;} = string.Empty;
    public UserProfile Follower {get; set;} = null!;
    public string FollowedId {get; set;} = string.Empty;
    public UserProfile Followed {get; set;} = null!;
    public DateTime FollowedAt {get; set;} = DateTime.UtcNow;
}