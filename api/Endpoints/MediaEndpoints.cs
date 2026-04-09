using Microsoft.EntityFrameworkCore;
using OrangeTv.Api.Data;
using OrangeTv.Api.Library;

namespace OrangeTv.Api.Endpoints;

public static class MediaEndpoints
{
    public static void MapMediaEndpoints(this WebApplication app)
    {
        app.MapGet(
                "/api/v1/media/items",
                async (
                    OrangeTvDbContext db,
                    int? skip,
                    int? take,
                    CancellationToken cancellationToken) =>
                {
                    var s = Math.Max(0, skip ?? 0);
                    var t = Math.Clamp(take ?? 50, 1, 200);
                    var query = db.MediaItems.AsNoTracking().OrderByDescending(x => x.LastScannedAtUtc);
                    var total = await query.CountAsync(cancellationToken).ConfigureAwait(false);
                    var rows = await query
                        .Skip(s)
                        .Take(t)
                        .Select(x => new MediaItemResponse(
                            x.Id,
                            x.FilePath,
                            x.Title,
                            x.DurationSeconds,
                            x.Width,
                            x.Height,
                            x.ThumbnailRelativePath,
                            x.LastScannedAtUtc,
                            x.LastScanError))
                        .ToListAsync(cancellationToken)
                        .ConfigureAwait(false);
                    return Results.Ok(
                        new MediaItemsPageResponse(total, s, t, rows.ToArray()));
                })
            .WithName("GetMediaItems")
            .WithTags("media");

        app.MapPost(
                "/api/v1/media/library/scan",
                (LibraryScannerService scanner) =>
                {
                    _ = Task.Run(
                        async () =>
                        {
                            try
                            {
                                await scanner.ScanFullAsync(CancellationToken.None).ConfigureAwait(false);
                            }
                            catch
                            {
                                // logged inside scanner
                            }
                        },
                        CancellationToken.None);
                    return Results.Accepted("/api/v1/media/items", new { accepted = true });
                })
            .WithName("PostLibraryScan")
            .WithTags("media");
    }

    private sealed record MediaItemResponse(
        Guid Id,
        string FilePath,
        string? Title,
        double? DurationSeconds,
        int? Width,
        int? Height,
        string? ThumbnailRelativePath,
        DateTime LastScannedAtUtc,
        string? LastScanError);

    private sealed record MediaItemsPageResponse(
        int Total,
        int Skip,
        int Take,
        MediaItemResponse[] Items);
}
