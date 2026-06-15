namespace TuneVault.Domain.Entities;

public class Favourite
{
    public Guid UserId {get; set;}
    public UserProfile User {get; set;} = null!;
    public Guid MediaItemId {get; set;}
    public MediaItem MediaItem {get; set;} = null!;
    public DateTime AddedAt {get; set;} = DateTime.UtcNow;
}