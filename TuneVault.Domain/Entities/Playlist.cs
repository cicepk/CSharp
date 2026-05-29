namespace TuneVault.Domain.Entities
{
    public class Playlist
    {
        public Guid Id {get;set;} = Guid.NewGuid();
        public string Name {get;set;} = string.Empty;
        public bool isPublic {get;set;} = false;
        public DateTime CreatedAt {get;set;} = DateTime.UtcNow;

        public Guid OwnerId {get;set;}
        public UserProfile Owner {get;set;} = null!;
        //trung gian
        public ICollection<PlaylistItem> PlaylistItems {get;set;} = new List<PlaylistItem>();
    }
}