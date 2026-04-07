using Microsoft.EntityFrameworkCore;
using OrangeTv.Api.Data.Entities;

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
}
