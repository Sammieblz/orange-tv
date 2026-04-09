using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using OrangeTv.Api.Configuration;
using OrangeTv.Api.Data;
using OrangeTv.Api.Library;
using OrangeTv.Api.Platform;
using OrangeTv.Api.Tests.Support;
using Xunit;

namespace OrangeTv.Api.Tests.Library;

public sealed class LibraryScannerServiceTests
{
    [Fact]
    public async Task ScanFullAsync_inserts_row_using_stub_metadata()
    {
        var temp = Path.Combine(Path.GetTempPath(), "scan-" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(temp);
        var file = Path.Combine(temp, "sample.mp4");
        await File.WriteAllTextAsync(file, "x");

        try
        {
            await using var conn = new SqliteConnection("DataSource=:memory:");
            await conn.OpenAsync();
            var dbOpts = new DbContextOptionsBuilder<OrangeTvDbContext>().UseSqlite(conn).Options;
            await using (var db = new OrangeTvDbContext(dbOpts))
            {
                await db.Database.MigrateAsync();
            }

            await using var provider = BuildProvider(conn, temp, enabled: true);
            var scanner = provider.GetRequiredService<LibraryScannerService>();
            var summary = await scanner.ScanFullAsync(CancellationToken.None);

            Assert.True(summary.DiscoveredFiles >= 1);
            Assert.True(summary.InsertedOrUpdated >= 1);

            await using var dbRead = new OrangeTvDbContext(dbOpts);
            var item = await dbRead.MediaItems.SingleAsync();
            Assert.Equal("StubTitle", item.Title);
            Assert.Equal(42, item.DurationSeconds);
            Assert.Null(item.LastScanError);
        }
        finally
        {
            TryDeleteDir(temp);
        }
    }

    [Fact]
    public async Task ScanFullAsync_skips_unchanged_file_on_second_scan()
    {
        var temp = Path.Combine(Path.GetTempPath(), "scan2-" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(temp);
        var file = Path.Combine(temp, "keep.mp4");
        await File.WriteAllTextAsync(file, "x");

        try
        {
            await using var conn = new SqliteConnection("DataSource=:memory:");
            await conn.OpenAsync();
            var dbOpts = new DbContextOptionsBuilder<OrangeTvDbContext>().UseSqlite(conn).Options;
            await using (var db = new OrangeTvDbContext(dbOpts))
            {
                await db.Database.MigrateAsync();
            }

            await using var provider = BuildProvider(conn, temp, enabled: true);
            var scanner = provider.GetRequiredService<LibraryScannerService>();

            var first = await scanner.ScanFullAsync(CancellationToken.None);
            Assert.True(first.InsertedOrUpdated >= 1);

            var second = await scanner.ScanFullAsync(CancellationToken.None);
            Assert.True(second.SkippedUnchanged >= 1);
            Assert.Equal(0, second.InsertedOrUpdated);
        }
        finally
        {
            TryDeleteDir(temp);
        }
    }

    [Fact]
    public async Task ScanFullAsync_returns_empty_summary_when_library_disabled()
    {
        await using var conn = new SqliteConnection("DataSource=:memory:");
        await conn.OpenAsync();
        var dbOpts = new DbContextOptionsBuilder<OrangeTvDbContext>().UseSqlite(conn).Options;
        await using (var db = new OrangeTvDbContext(dbOpts))
        {
            await db.Database.MigrateAsync();
        }

        await using var provider = BuildProvider(conn, Path.GetTempPath(), enabled: false);
        var scanner = provider.GetRequiredService<LibraryScannerService>();
        var summary = await scanner.ScanFullAsync(CancellationToken.None);

        Assert.Equal(0, summary.DiscoveredFiles);
        Assert.Equal(0, summary.InsertedOrUpdated);
    }

    private static ServiceProvider BuildProvider(SqliteConnection conn, string scanRoot, bool enabled)
    {
        var services = new ServiceCollection();
        services.AddDbContext<OrangeTvDbContext>(o => o.UseSqlite(conn), ServiceLifetime.Scoped);
        services.AddSingleton<IOptions<OrangetvApiOptions>>(
            Options.Create(
                new OrangetvApiOptions
                {
                    Library = new LibraryOptions
                    {
                        Enabled = enabled,
                        ScanRoots = enabled ? [scanRoot] : [],
                        FileExtensions = [".mp4"],
                    },
                }));
        services.AddSingleton<IPlatformEnvironment>(
            new FakePlatformEnvironment { IsWindows = true, IsLinux = false });
        services.AddSingleton<LibraryRootsResolver>();
        services.AddSingleton<IMediaMetadataExtractor, StubMetadataExtractor>();
        services.AddSingleton<IMediaThumbnailGenerator, StubThumbnailGenerator>();
        services.AddSingleton<ILogger<LibraryScannerService>>(NullLogger<LibraryScannerService>.Instance);
        services.AddSingleton<LibraryScannerService>();
        return services.BuildServiceProvider();
    }

    private static void TryDeleteDir(string path)
    {
        try
        {
            if (Directory.Exists(path))
            {
                Directory.Delete(path, true);
            }
        }
        catch
        {
            // ignore
        }
    }

    private sealed class StubMetadataExtractor : IMediaMetadataExtractor
    {
        public Task<MediaMetadataResult> ExtractAsync(string filePath, CancellationToken cancellationToken) =>
            Task.FromResult(new MediaMetadataResult("StubTitle", 42, 640, 480, true, null));
    }

    private sealed class StubThumbnailGenerator : IMediaThumbnailGenerator
    {
        public Task<bool> TryGenerateAsync(
            string filePath,
            double? durationSeconds,
            bool hasVideoStream,
            string outputJpegPath,
            CancellationToken cancellationToken) =>
            Task.FromResult(false);
    }
}
