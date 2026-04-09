using Microsoft.EntityFrameworkCore;
using OrangeTv.Api.Data;
using OrangeTv.Api.Data.Entities;
using OrangeTv.Api.Services;

namespace OrangeTv.Api.Endpoints;

public static class WatchEndpoints
{
    public static void MapWatchEndpoints(this WebApplication app)
    {
        app.MapPost(
                "/api/v1/watch/events",
                async (
                    PostWatchEventRequest body,
                    OrangeTvDbContext db,
                    WatchHistoryWriteHelper watch,
                    CancellationToken cancellationToken) =>
                {
                    if (!TryParseEventType(body.EventType, out var eventType))
                    {
                        return Results.BadRequest(new { error = "invalid-event-type" });
                    }

                    var now = DateTime.UtcNow;
                    var launchSessionId = body.LaunchSessionId;
                    if (launchSessionId is not null)
                    {
                        var exists = await db.LaunchSessions.AsNoTracking()
                            .AnyAsync(s => s.Id == launchSessionId, cancellationToken)
                            .ConfigureAwait(false);
                        if (!exists)
                        {
                            return Results.BadRequest(new { error = "launch-session-not-found" });
                        }
                    }

                    if (body.AppId is { Length: > 0 })
                    {
                        var appOk = await db.Apps.AsNoTracking()
                            .AnyAsync(a => a.Id == body.AppId, cancellationToken)
                            .ConfigureAwait(false);
                        if (!appOk)
                        {
                            return Results.BadRequest(new { error = "app-not-found" });
                        }
                    }

                    if (body.MediaItemId is Guid mid)
                    {
                        var mediaOk = await db.MediaItems.AsNoTracking()
                            .AnyAsync(m => m.Id == mid, cancellationToken)
                            .ConfigureAwait(false);
                        if (!mediaOk)
                        {
                            return Results.BadRequest(new { error = "media-not-found" });
                        }
                    }

                    var entity = new WatchEventEntity
                    {
                        Id = Guid.NewGuid(),
                        OccurredAtUtc = now,
                        EventType = eventType,
                        LaunchSessionId = launchSessionId,
                        AppId = body.AppId,
                        MediaItemId = body.MediaItemId,
                        PositionSeconds = body.PositionSeconds,
                        DurationSeconds = body.DurationSeconds,
                        PayloadJson = body.PayloadJson,
                    };

                    watch.AddEvent(db, entity, now);
                    await db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

                    return Results.Ok(new PostWatchEventResponse(entity.Id, entity.OccurredAtUtc));
                })
            .WithName("PostWatchEvent")
            .WithTags("watch");

        app.MapGet(
                "/api/v1/watch/continue",
                async (
                    OrangeTvDbContext db,
                    int? take,
                    CancellationToken cancellationToken) =>
                {
                    var limit = Math.Clamp(take ?? 24, 1, 100);
                    const double nearlyDone = 0.98;
                    var rows = await (
                            from r in db.MediaResumes.AsNoTracking()
                            join m in db.MediaItems.AsNoTracking() on r.MediaItemId equals m.Id
                            where r.DurationSeconds > 0
                                && r.PositionSeconds > 0
                                && r.PositionSeconds < r.DurationSeconds * nearlyDone
                            orderby r.LastPlayedAtUtc descending, r.MediaItemId
                            select new ContinueWatchingItemResponse(
                                m.Id,
                                m.Title ?? m.FilePath,
                                m.ThumbnailRelativePath,
                                r.PositionSeconds / r.DurationSeconds,
                                r.LastPlayedAtUtc))
                        .Take(limit)
                        .ToListAsync(cancellationToken)
                        .ConfigureAwait(false);

                    return Results.Ok(new ContinueWatchingListResponse(rows.ToArray()));
                })
            .WithName("GetWatchContinue")
            .WithTags("watch");

        app.MapGet(
                "/api/v1/watch/history",
                async (
                    OrangeTvDbContext db,
                    int? skip,
                    int? take,
                    CancellationToken cancellationToken) =>
                {
                    var s = Math.Max(0, skip ?? 0);
                    var t = Math.Clamp(take ?? 50, 1, 200);
                    var query = db.WatchEvents.AsNoTracking().OrderByDescending(x => x.OccurredAtUtc);
                    var total = await query.CountAsync(cancellationToken).ConfigureAwait(false);
                    var rows = await query
                        .Skip(s)
                        .Take(t)
                        .Select(x => new WatchHistoryItemResponse(
                            x.Id,
                            x.OccurredAtUtc,
                            x.EventType.ToString(),
                            x.LaunchSessionId,
                            x.AppId,
                            x.MediaItemId,
                            x.PositionSeconds,
                            x.DurationSeconds))
                        .ToListAsync(cancellationToken)
                        .ConfigureAwait(false);
                    return Results.Ok(new WatchHistoryPageResponse(total, s, t, rows.ToArray()));
                })
            .WithName("GetWatchHistory")
            .WithTags("watch");
    }

    private static bool TryParseEventType(string? value, out WatchEventType eventType)
    {
        eventType = default;
        if (string.IsNullOrWhiteSpace(value))
        {
            return false;
        }

        return Enum.TryParse(value.Trim(), ignoreCase: true, out eventType);
    }

    private sealed record PostWatchEventRequest(
        string? EventType,
        Guid? LaunchSessionId,
        string? AppId,
        Guid? MediaItemId,
        double? PositionSeconds,
        double? DurationSeconds,
        string? PayloadJson);

    private sealed record PostWatchEventResponse(Guid Id, DateTime OccurredAtUtc);

    private sealed record ContinueWatchingItemResponse(
        Guid MediaItemId,
        string Title,
        string? ThumbnailRelativePath,
        double Progress,
        DateTime LastPlayedAtUtc);

    private sealed record ContinueWatchingListResponse(ContinueWatchingItemResponse[] Items);

    private sealed record WatchHistoryItemResponse(
        Guid Id,
        DateTime OccurredAtUtc,
        string EventType,
        Guid? LaunchSessionId,
        string? AppId,
        Guid? MediaItemId,
        double? PositionSeconds,
        double? DurationSeconds);

    private sealed record WatchHistoryPageResponse(
        int Total,
        int Skip,
        int Take,
        WatchHistoryItemResponse[] Items);
}
