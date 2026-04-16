using Microsoft.EntityFrameworkCore;
using OrangeTv.Api.Data.Entities;
using OrangeTv.Api.Launch;

namespace OrangeTv.Api.Data;

public static class DbSeeder
{
    /// <summary>
    /// Inserts baseline rows when the database is empty (idempotent).
    /// </summary>
    public static async Task SeedAsync(OrangeTvDbContext db, CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;

        var desired = new[]
        {
            new AppEntity
            {
                Id = "launch-streaming-demo",
                Label = "Open streaming (Chrome)",
                Type = "chrome",
                LaunchUrl = "https://example.com",
                SortOrder = 0,
                CreatedAtUtc = now,
                UpdatedAtUtc = now,
            },
            new AppEntity
            {
                Id = "launch-mpv-demo",
                Label = "Play sample (MPV)",
                Type = "mpv",
                LaunchUrl = "",
                SortOrder = 1,
                CreatedAtUtc = now,
                UpdatedAtUtc = now,
            },
            // Real streaming shortcuts (Chrome).
            new AppEntity
            {
                Id = "netflix",
                Label = "Netflix",
                Type = "chrome",
                LaunchUrl = "https://www.netflix.com",
                SortOrder = 100,
                CreatedAtUtc = now,
                UpdatedAtUtc = now,
            },
            new AppEntity
            {
                Id = "prime-video",
                Label = "Prime Video",
                Type = "chrome",
                LaunchUrl = "https://www.primevideo.com",
                SortOrder = 110,
                CreatedAtUtc = now,
                UpdatedAtUtc = now,
            },
            new AppEntity
            {
                Id = "disney-plus",
                Label = "Disney+",
                Type = "chrome",
                LaunchUrl = "https://www.disneyplus.com",
                SortOrder = 120,
                CreatedAtUtc = now,
                UpdatedAtUtc = now,
            },
            new AppEntity
            {
                Id = "youtube",
                Label = "YouTube",
                Type = "chrome",
                LaunchUrl = "https://www.youtube.com/tv",
                SortOrder = 130,
                CreatedAtUtc = now,
                UpdatedAtUtc = now,
            },
        };

        var existingIds = await db.Apps.AsNoTracking()
            .Select(a => a.Id)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);
        var existing = new HashSet<string>(existingIds, StringComparer.OrdinalIgnoreCase);

        foreach (var app in desired)
        {
            if (existing.Contains(app.Id))
            {
                continue;
            }

            db.Apps.Add(app);
        }

        await db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }

    /// <summary>Ensures the synthetic MPV app used for <c>POST /api/v1/launch/media/…</c> exists (idempotent).</summary>
    public static async Task EnsureLocalMediaLauncherAppAsync(
        OrangeTvDbContext db,
        CancellationToken cancellationToken = default)
    {
        const string id = LocalMediaAppConstants.AppId;
        if (await db.Apps.AnyAsync(a => a.Id == id, cancellationToken).ConfigureAwait(false))
        {
            return;
        }

        var now = DateTime.UtcNow;
        db.Apps.Add(
            new AppEntity
            {
                Id = id,
                Label = "Local library (MPV)",
                Type = "mpv",
                LaunchUrl = null,
                SortOrder = 999,
                CreatedAtUtc = now,
                UpdatedAtUtc = now,
            });
        await db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }
}
