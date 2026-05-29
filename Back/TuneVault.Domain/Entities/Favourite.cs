namespace TuneVault.Domain.Entities;

public class Favourite
{
    public Guid Id {get; set;} = Guid.NewGuid();
    public string UserId {get; set;} = string.Empty;
    public UserProfile User {get; set;} = null!;
    public Guid MediaItemId {get; set;}
    public MediaItem MediaItem {get; set;} = null!;
    public DateTime AddedAt {get; set;} = DateTime.UtcNow;
}