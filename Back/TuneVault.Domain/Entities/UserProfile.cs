using TuneVault.Domain.Enums;

namespace TuneVault.Domain.Entities
{
    public class UserProfile
    {
        public Guid Id {get; set;} = Guid.NewGuid();
        public string UserName {get; set;} = string.Empty;
        public string Email {get; set;} = string.Empty;
        public string? Bio {get; set;}
        public string? AvatarPath {get; set;}
        public DateTime CreatedAt {get; set;} = DateTime.UtcNow;
        public UserRole Role {get; set;} = UserRole.User;

        public ICollection<MediaItem> MediaItems {get; set;} = new List<MediaItem>();
        public ICollection<Playlist> Playlists {get; set;} = new List<Playlist>();
        public ICollection<Notification> Notifications {get; set;} = new List<Notification>();
        public ICollection<Follow> FollowedBy {get; set;} = new List<Follow>();
        public ICollection<Follow> Following {get; set;} = new List<Follow>();
        public ICollection<MediaShare> SharedByMe {get; set;} = new List<MediaShare>();
        public ICollection<MediaShare> SharedToMe {get; set;} = new List<MediaShare>();
        public ICollection<Favourite> Favourites {get; set;} = new List<Favourite>();
    }
}