namespace TuneVault.Domain.Entities
{
    public class Genre
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;

        public ICollection<MediaItem> MediaItems { get; set; } = new List<MediaItem>();
    }
}