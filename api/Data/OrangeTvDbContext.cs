using Microsoft.EntityFrameworkCore;
using OrangeTv.Api.Data.Entities;

namespace OrangeTv.Api.Data;

public sealed class OrangeTvDbContext : DbContext
{
    public OrangeTvDbContext(DbContextOptions<OrangeTvDbContext> options)
        : base(options)
    {
    }

    public DbSet<AppEntity> Apps => Set<AppEntity>();

    public DbSet<SettingEntity> Settings => Set<SettingEntity>();

    public DbSet<LaunchSessionEntity> LaunchSessions => Set<LaunchSessionEntity>();

    public DbSet<MediaItemEntity> MediaItems => Set<MediaItemEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<AppEntity>(e =>
        {
            e.ToTable("apps");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasMaxLength(64);
            e.Property(x => x.Label).HasMaxLength(256).IsRequired();
            e.Property(x => x.Type).HasMaxLength(64);
            e.Property(x => x.LaunchUrl).HasMaxLength(2048);
            e.Property(x => x.ChromeProfileSegment).HasMaxLength(128);
            e.Property(x => x.SessionFreshness).HasConversion<int>();
            e.HasIndex(x => x.SortOrder);
        });

        modelBuilder.Entity<SettingEntity>(e =>
        {
            e.ToTable("settings");
            e.HasKey(x => x.Key);
            e.Property(x => x.Key).HasMaxLength(256);
            e.Property(x => x.Value).HasMaxLength(8192);
        });

        modelBuilder.Entity<LaunchSessionEntity>(e =>
        {
            e.ToTable("launch_sessions");
            e.HasKey(x => x.Id);
            e.Property(x => x.AppId).HasMaxLength(64).IsRequired();
            e.Property(x => x.SpawnError).HasMaxLength(2048);
            e.HasIndex(x => x.StartedAtUtc);
            e.HasOne<AppEntity>()
                .WithMany()
                .HasForeignKey(x => x.AppId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<MediaItemEntity>(e =>
        {
            e.ToTable("media_items");
            e.HasKey(x => x.Id);
            e.Property(x => x.FilePath).HasMaxLength(4096).IsRequired();
            e.HasIndex(x => x.FilePath).IsUnique();
            e.Property(x => x.Title).HasMaxLength(512);
            e.Property(x => x.MetadataJson).HasMaxLength(65536);
            e.Property(x => x.ThumbnailRelativePath).HasMaxLength(1024);
            e.Property(x => x.LastScanError).HasMaxLength(4096);
            e.HasIndex(x => x.LastScannedAtUtc);
        });
    }
}
