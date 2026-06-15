namespace TuneVault.Domain.Entities;

public class Follow
{
    public Guid FollowerId {get; set;}
    public UserProfile Follower {get; set;} = null!;
    public Guid FollowedId {get; set;}
    public UserProfile Followed {get; set;} = null!;
    public DateTime FollowedAt {get; set;} = DateTime.UtcNow;
}