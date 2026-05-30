using Microsoft.EntityFrameworkCore;
using TuneVault.Application.Interfaces;
using TuneVault.Domain.Entities;

namespace TuneVault.Infrastructure.Data
{
    public class ApplicationDbContext : DbContext, IApplicationDbContext
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

        // khoa chinh kep cho follow
        modelBuilder.Entity<Follow>()
            .HasKey(f => new { f.FollowerId, f.FollowedId });

        modelBuilder.Entity<Follow>()
            .HasOne(f => f.Follower)
            .WithMany(u => u.Following)
            .HasForeignKey(f => f.FollowerId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Follow>()
            .HasOne(f => f.Followed)
            .WithMany(u => u.FollowedBy)
            .HasForeignKey(f => f.FollowedId)
            .OnDelete(DeleteBehavior.Restrict);

        // khoa chinh kep cho favourite
        modelBuilder.Entity<Favourite>()
            .HasKey(f => new { f.UserId, f.MediaItemId });

        modelBuilder.Entity<Favourite>()
            .HasOne(f => f.User)
            .WithMany(u => u.Favourites)
            .HasForeignKey(f => f.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Favourite>()
            .HasOne(f => f.MediaItem)
            .WithMany()
            .HasForeignKey(f => f.MediaItemId)
            .OnDelete(DeleteBehavior.Restrict);

        // cau hinh media share relationships
        modelBuilder.Entity<MediaShare>()
            .HasOne(m => m.MediaItem)
            .WithMany()
            .HasForeignKey(m => m.MediaItemId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<MediaShare>()
            .HasOne(m => m.SharedByUser)
            .WithMany(u => u.SharedByMe)
            .HasForeignKey(m => m.SharedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<MediaShare>()
            .HasOne(m => m.SharedToUser)
            .WithMany(u => u.SharedToMe)
            .HasForeignKey(m => m.SharedToUserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
    }
}