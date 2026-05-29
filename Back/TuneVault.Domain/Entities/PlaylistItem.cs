namespace TuneVault.Domain.Entities;

public class PlaylistItem
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid PlaylistId { get; set; }
    public Playlist Playlist { get; set; } = null!;

    public Guid MediaItemId { get; set; }
    public MediaItem MediaItem { get; set; } = null!;

    public DateTime AddedAt { get; set; } = DateTime.UtcNow;
}