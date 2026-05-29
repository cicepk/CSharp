using Microsoft.EntityFrameworkCore;
using TuneVault.Domain.Entities;

namespace TuneVault.Infrastructure.Data
{
    public class ApplicationDbContext : DbContext
    {
        //khoi tao constructor
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }
        public DbSet<UserProfile> UserProfiles {get; set;} 
        public DbSet<MediaItem> MediaItems {get; set;}
        public DbSet<Playlist> Playlists {get; set;}
        public DbSet<PlaylistItem> PlaylistItems {get; set;}
        public DbSet<Notification> Notifications {get; set;}
        public DbSet<Follow> Follows {get; set;}
        public DbSet<MediaShare> MediaShares {get; set;}
        public DbSet<Favourite> Favourites {get; set;}
        protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        //khoa chinh kep cho playlistitem
        modelBuilder.Entity<PlaylistItem>()
            .HasKey(pi => new { pi.PlaylistId, pi.MediaItemId });

        //cat xoa day chuyen doi khi xoa playlist hoac mediaitem xuong playlistitem
        modelBuilder.Entity<PlaylistItem>()
            .HasOne(pi => pi.Playlist)
            .WithMany(p => p.PlaylistItems)
            .HasForeignKey(pi => pi.PlaylistId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<PlaylistItem>()
            .HasOne(pi => pi.MediaItem)
            .WithMany(m => m.PlaylistItems)
            .HasForeignKey(pi => pi.MediaItemId)
            .OnDelete(DeleteBehavior.Restrict);
    }
    }
}