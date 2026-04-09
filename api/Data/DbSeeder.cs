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
        if (await db.Apps.AnyAsync(cancellationToken).ConfigureAwait(false))
        {
            return;
        }

        var now = DateTime.UtcNow;
        db.Apps.AddRange(
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
            });

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
