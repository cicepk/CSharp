namespace TuneVault.Domain.Entities
{
    public class UserProfile
    {
        public Guid Id {get; set;} = Guid.NewGuid();
        public string UserName {get; set;} = string.Empty;
        public string Email {get; set;} = string.Empty;
        public DateTime CreatedAt {get; set;} = DateTime.UtcNow;

        public ICollection<MediaItem> MediaItems {get; set;} = new List<MediaItem>();
        public ICollection<Playlist> Playlists {get; set;} = new List<Playlist>();
    }
}