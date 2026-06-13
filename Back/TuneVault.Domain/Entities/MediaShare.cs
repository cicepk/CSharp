namespace TuneVault.Domain.Entities;

public class MediaShare
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid? MediaItemId { get; set; }
    public MediaItem? MediaItem { get; set; }

    public Guid SharedByUserId { get; set; }
    public UserProfile SharedByUser { get; set; } = null!;

    public Guid SharedToUserId { get; set; }
    public UserProfile SharedToUser { get; set; } = null!;
    public Guid? PlaylistId { get; set; }

    public DateTime SharedAt { get; set; } = DateTime.UtcNow;

}