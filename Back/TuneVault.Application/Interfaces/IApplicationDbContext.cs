using Microsoft.EntityFrameworkCore;
using TuneVault.Domain.Entities;

namespace TuneVault.Application.Interfaces;

public interface IApplicationDbContext
{
    DbSet<UserProfile> UserProfiles { get; }
    DbSet<MediaItem> MediaItems { get;  }
    DbSet<Playlist> Playlists { get; }
    DbSet<PlaylistItem> PlaylistItems { get; }
    DbSet<Notification> Notifications { get; }
    DbSet<Follow> Follows { get; }
    DbSet<MediaShare> MediaShares { get; }
    DbSet<Favourite> Favourites { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}