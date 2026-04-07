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
            e.HasIndex(x => x.SortOrder);
        });

        modelBuilder.Entity<SettingEntity>(e =>
        {
            e.ToTable("settings");
            e.HasKey(x => x.Key);
            e.Property(x => x.Key).HasMaxLength(256);
            e.Property(x => x.Value).HasMaxLength(8192);
        });
    }
}
