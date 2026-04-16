using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using OrangeTv.Api.Data;
using OrangeTv.Api.Launch;
using Xunit;

namespace OrangeTv.Api.Tests.Data;

public sealed class DbSeederTests
{
    [Fact]
    public async Task SeedAsync_inserts_baseline_apps_when_table_empty()
    {
        await using var connection = new SqliteConnection("DataSource=:memory:");
        await connection.OpenAsync();
        var options = new DbContextOptionsBuilder<OrangeTvDbContext>()
            .UseSqlite(connection)
            .Options;

        await using var db = new OrangeTvDbContext(options);
        await db.Database.MigrateAsync();
        await DbSeeder.SeedAsync(db);

        var apps = await db.Apps
            .OrderBy(a => a.SortOrder)
            .ThenBy(a => a.Id)
            .ToListAsync();
        Assert.Equal(6, apps.Count);
        Assert.Equal("launch-streaming-demo", apps[0].Id);
        Assert.Equal("Open streaming (Chrome)", apps[0].Label);
        Assert.Equal("chrome", apps[0].Type);
        Assert.Equal("launch-mpv-demo", apps[1].Id);
        Assert.Equal("Play sample (MPV)", apps[1].Label);

        // Spot-check that real streaming shortcuts exist (ordering is deterministic by SortOrder then Id).
        Assert.Contains(apps, a => a.Id == "netflix" && a.Type == "chrome");
        Assert.Contains(apps, a => a.Id == "prime-video" && a.Type == "chrome");
        Assert.Contains(apps, a => a.Id == "disney-plus" && a.Type == "chrome");
        Assert.Contains(apps, a => a.Id == "youtube" && a.Type == "chrome");
    }

    [Fact]
    public async Task SeedAsync_second_call_does_not_duplicate_rows()
    {
        await using var connection = new SqliteConnection("DataSource=:memory:");
        await connection.OpenAsync();
        var options = new DbContextOptionsBuilder<OrangeTvDbContext>()
            .UseSqlite(connection)
            .Options;

        await using var db = new OrangeTvDbContext(options);
        await db.Database.MigrateAsync();

        await DbSeeder.SeedAsync(db);
        await DbSeeder.SeedAsync(db);

        Assert.Equal(6, await db.Apps.CountAsync());
    }

    [Fact]
    public async Task EnsureLocalMediaLauncherAppAsync_inserts_local_media_app_when_missing()
    {
        await using var connection = new SqliteConnection("DataSource=:memory:");
        await connection.OpenAsync();
        var options = new DbContextOptionsBuilder<OrangeTvDbContext>()
            .UseSqlite(connection)
            .Options;

        await using var db = new OrangeTvDbContext(options);
        await db.Database.MigrateAsync();
        await DbSeeder.SeedAsync(db);
        await DbSeeder.EnsureLocalMediaLauncherAppAsync(db);

        var app = await db.Apps.AsNoTracking().SingleAsync(a => a.Id == LocalMediaAppConstants.AppId);
        Assert.Equal("Local library (MPV)", app.Label);
        Assert.Equal("mpv", app.Type);
    }

    [Fact]
    public async Task EnsureLocalMediaLauncherAppAsync_second_call_is_idempotent()
    {
        await using var connection = new SqliteConnection("DataSource=:memory:");
        await connection.OpenAsync();
        var options = new DbContextOptionsBuilder<OrangeTvDbContext>()
            .UseSqlite(connection)
            .Options;

        await using var db = new OrangeTvDbContext(options);
        await db.Database.MigrateAsync();
        await DbSeeder.SeedAsync(db);
        await DbSeeder.EnsureLocalMediaLauncherAppAsync(db);
        await DbSeeder.EnsureLocalMediaLauncherAppAsync(db);

        Assert.Equal(1, await db.Apps.CountAsync(a => a.Id == LocalMediaAppConstants.AppId));
    }
}
