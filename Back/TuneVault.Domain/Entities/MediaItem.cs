using TuneVault.Domain.Enums;
namespace TuneVault.Domain.Entities
{
    public class MediaItem
    {
        public Guid Id {get; set;} = Guid.NewGuid();
        public string Title {get; set;} = string.Empty;
        public string Artist {get; set;} = string.Empty;
        public string FilePath {get; set;} = string.Empty;
        public string? CoverPath {get; set;}
        public MediaType MediaType {get; set;}
        public int DurationSeconds {get; set;} 
        public DateTime CreatedAt {get; set;} = DateTime.UtcNow;

        public Guid OwnerId {get; set;}
        public UserProfile Owner {get; set;} = null!;
        //trung gian
        public ICollection<PlaylistItem> PlaylistItems {get; set;} = new List<PlaylistItem>();
        public ICollection<MediaGenre> MediaGenres { get; set; } = new List<MediaGenre>();
    }
}