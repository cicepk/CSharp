namespace TuneVault.Domain.Entities;

public class MediaGenre
{
    public Guid MediaItemId { get; set; }
    public MediaItem MediaItem { get; set; } = null!;

    public Guid GenreId { get; set; }
    public Genre Genre { get; set; } = null!;
    
    public DateTime AddedAt { get; set; } = DateTime.UtcNow;
}