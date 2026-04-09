using System.Text.Json;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using OrangeTv.Api.Configuration;
using OrangeTv.Api.Data;
using OrangeTv.Api.Data.Entities;
using OrangeTv.Api.Library;
using OrangeTv.Api.Tests.Support;
using Xunit;

namespace OrangeTv.Api.Tests.Library;

public sealed class LibraryRootsResolverTests
{
    [Fact]
    public async Task GetEffectiveRootsAsync_uses_config_when_settings_missing()
    {
        await using var connection = new SqliteConnection("DataSource=:memory:");
        await connection.OpenAsync();
        var options = new DbContextOptionsBuilder<OrangeTvDbContext>()
            .UseSqlite(connection)
            .Options;

        await using (var db = new OrangeTvDbContext(options))
        {
            await db.Database.MigrateAsync();
        }

        var root = Path.Combine(Path.GetTempPath(), "lib-root-" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(root);
        try
        {
            var apiOpts = Options.Create(
                new OrangetvApiOptions
                {
                    Library = new LibraryOptions { ScanRoots = [root] },
                });
            var resolver = new LibraryRootsResolver(apiOpts, new FakePlatformEnvironment { IsWindows = true, IsLinux = false });
            await using var db = new OrangeTvDbContext(options);
            var roots = await resolver.GetEffectiveRootsAsync(db, CancellationToken.None);
            Assert.Single(roots);
            Assert.Equal(Path.GetFullPath(root), roots[0], StringComparer.OrdinalIgnoreCase);
        }
        finally
        {
            try
            {
                Directory.Delete(root, true);
            }
            catch
            {
                // ignore
            }
        }
    }

    [Fact]
    public async Task GetEffectiveRootsAsync_settings_json_overrides_config()
    {
        await using var connection = new SqliteConnection("DataSource=:memory:");
        await connection.OpenAsync();
        var options = new DbContextOptionsBuilder<OrangeTvDbContext>()
            .UseSqlite(connection)
            .Options;

        var configRoot = Path.Combine(Path.GetTempPath(), "cfg-" + Guid.NewGuid().ToString("N"));
        var settingsRoot = Path.Combine(Path.GetTempPath(), "set-" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(configRoot);
        Directory.CreateDirectory(settingsRoot);
        try
        {
            await using (var db = new OrangeTvDbContext(options))
            {
                await db.Database.MigrateAsync();
                db.Settings.Add(
                    new SettingEntity
                    {
                        Key = LibraryRootsResolver.ScanRootsSettingKey,
                        Value = JsonSerializer.Serialize(new[] { settingsRoot }),
                        UpdatedAtUtc = DateTime.UtcNow,
                    });
                await db.SaveChangesAsync();
            }

            var apiOpts = Options.Create(
                new OrangetvApiOptions
                {
                    Library = new LibraryOptions { ScanRoots = [configRoot] },
                });
            var resolver = new LibraryRootsResolver(apiOpts, new FakePlatformEnvironment { IsWindows = true, IsLinux = false });
            await using var dbContext = new OrangeTvDbContext(options);
            var roots = await resolver.GetEffectiveRootsAsync(dbContext, CancellationToken.None);
            Assert.Single(roots);
            Assert.Equal(Path.GetFullPath(settingsRoot), roots[0], StringComparer.OrdinalIgnoreCase);
        }
        finally
        {
            try
            {
                Directory.Delete(configRoot, true);
            }
            catch
            {
                // ignore
            }

            try
            {
                Directory.Delete(settingsRoot, true);
            }
            catch
            {
                // ignore
            }
        }
    }

    [Fact]
    public async Task GetEffectiveRootsAsync_invalid_settings_json_falls_back_to_config()
    {
        await using var connection = new SqliteConnection("DataSource=:memory:");
        await connection.OpenAsync();
        var options = new DbContextOptionsBuilder<OrangeTvDbContext>()
            .UseSqlite(connection)
            .Options;

        var configRoot = Path.Combine(Path.GetTempPath(), "cfg2-" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(configRoot);
        try
        {
            await using (var db = new OrangeTvDbContext(options))
            {
                await db.Database.MigrateAsync();
                db.Settings.Add(
                    new SettingEntity
                    {
                        Key = LibraryRootsResolver.ScanRootsSettingKey,
                        Value = "not-json",
                        UpdatedAtUtc = DateTime.UtcNow,
                    });
                await db.SaveChangesAsync();
            }

            var apiOpts = Options.Create(
                new OrangetvApiOptions
                {
                    Library = new LibraryOptions { ScanRoots = [configRoot] },
                });
            var resolver = new LibraryRootsResolver(apiOpts, new FakePlatformEnvironment { IsWindows = true, IsLinux = false });
            await using var dbContext = new OrangeTvDbContext(options);
            var roots = await resolver.GetEffectiveRootsAsync(dbContext, CancellationToken.None);
            Assert.Single(roots);
            Assert.Equal(Path.GetFullPath(configRoot), roots[0], StringComparer.OrdinalIgnoreCase);
        }
        finally
        {
            try
            {
                Directory.Delete(configRoot, true);
            }
            catch
            {
                // ignore
            }
        }
    }
}
