using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using OrangeTv.Api.Data;
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
        Assert.Equal(2, apps.Count);
        Assert.Equal("launch-streaming-demo", apps[0].Id);
        Assert.Equal("Open streaming (Chrome)", apps[0].Label);
        Assert.Equal("chrome", apps[0].Type);
        Assert.Equal("launch-mpv-demo", apps[1].Id);
        Assert.Equal("Play sample (MPV)", apps[1].Label);
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

        Assert.Equal(2, await db.Apps.CountAsync());
    }
}
