using Microsoft.EntityFrameworkCore;
using OrangeTv.Api.Data;
using OrangeTv.Api.Data.Entities;
using OrangeTv.Api.Platform;
using OrangeTv.Api.Services;

namespace OrangeTv.Api.Endpoints;

public static class ApiV1Endpoints
{
    internal static bool TryParseSessionFreshness(string? value, out SessionFreshness freshness)
    {
        freshness = SessionFreshness.Unknown;
        if (string.IsNullOrWhiteSpace(value))
        {
            return false;
        }

        return Enum.TryParse(value.Trim(), ignoreCase: true, out freshness);
    }

    private static string LaunchKind(string? type) =>
        string.IsNullOrWhiteSpace(type) ? "unknown" : type.Trim().ToLowerInvariant();

    public static void MapApiV1Endpoints(this WebApplication app)
    {
        app.MapGet(
                "/api/v1/health",
                async (OrangeTvDbContext db, CancellationToken cancellationToken) =>
                {
                    var canConnect = await db.Database.CanConnectAsync(cancellationToken).ConfigureAwait(false);
                    return Results.Ok(
                        new HealthResponse(
                            Status: canConnect ? "ok" : "degraded",
                            Database: canConnect ? "ok" : "unavailable",
                            TimestampUtc: DateTime.UtcNow));
                })
            .WithName("GetHealth")
            .WithTags("health");

        app.MapGet(
                "/api/v1/settings",
                async (OrangeTvDbContext db, CancellationToken cancellationToken) =>
                {
                    var rows = await db.Settings
                        .AsNoTracking()
                        .OrderBy(s => s.Key)
                        .ToListAsync(cancellationToken)
                        .ConfigureAwait(false);
                    return Results.Ok(
                        new SettingsListResponse(
                            Items: rows.Select(s => new SettingItemResponse(s.Key, s.Value, s.UpdatedAtUtc)).ToArray()));
                })
            .WithName("GetSettings")
            .WithTags("settings");

        app.MapPut(
                "/api/v1/settings/{key}",
                async (
                    string key,
                    PutSettingRequest body,
                    OrangeTvDbContext db,
                    CancellationToken cancellationToken) =>
                {
                    if (string.IsNullOrWhiteSpace(key) || key.Length > 256)
                    {
                        return Results.BadRequest(new { error = "invalid-key" });
                    }

                    var now = DateTime.UtcNow;
                    var row = await db.Settings.FirstOrDefaultAsync(s => s.Key == key, cancellationToken)
                        .ConfigureAwait(false);
                    if (row is null)
                    {
                        row = new SettingEntity { Key = key, UpdatedAtUtc = now };
                        db.Settings.Add(row);
                    }

                    row.Value = body.Value;
                    row.UpdatedAtUtc = now;
                    await db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
                    return Results.Ok(new SettingItemResponse(row.Key, row.Value, row.UpdatedAtUtc));
                })
            .WithName("PutSetting")
            .WithTags("settings");

        app.MapGet(
                "/api/v1/apps",
                async (OrangeTvDbContext db, CancellationToken cancellationToken) =>
                {
                    var rows = await db.Apps
                        .AsNoTracking()
                        .OrderBy(a => a.SortOrder)
                        .ThenBy(a => a.Id)
                        .ToListAsync(cancellationToken)
                        .ConfigureAwait(false);
                    return Results.Ok(
                        new AppsListResponse(
                            Items: rows.Select(a => new AppItemResponse(
                                    a.Id,
                                    a.Label,
                                    a.Type,
                                    a.LaunchUrl,
                                    a.SortOrder,
                                    a.CreatedAtUtc,
                                    a.UpdatedAtUtc,
                                    a.ChromeProfileSegment,
                                    a.SessionFreshness.ToString(),
                                    a.LastSessionEndedAtUtc,
                                    a.LastSessionExitCode))
                                .ToArray()));
                })
            .WithName("GetApps")
            .WithTags("apps");

        app.MapGet(
                "/api/v1/home",
                () =>
                {
                    HomeRowLayout[] rows =
                    [
                        new("continue", "Continue watching", ["GET /api/v1/watch/continue"]),
                        new("recent", "Recent", ["GET /api/v1/recommendations/home (rows[].rowId=recent)"]),
                        new("top-apps", "Top apps", ["GET /api/v1/recommendations/home (rows[].rowId=top-apps)"]),
                        new("picks", "Picks for you", ["GET /api/v1/recommendations/home (rows[].rowId=picks)"]),
                        new("launch-demos", "Launch demos", ["static shell tiles", "POST /api/v1/launch"]),
                        new("streaming", "Streaming", ["GET /api/v1/apps", "POST /api/v1/launch"]),
                        new("games", "Games", ["placeholder"]),
                    ];
                    return Results.Ok(new HomeLayoutResponse("home-v1", rows));
                })
            .WithName("GetHomeLayout")
            .WithTags("home");

        app.MapPut(
                "/api/v1/apps/{appId}/session-freshness",
                async (
                    string appId,
                    PutAppSessionFreshnessRequest body,
                    OrangeTvDbContext db,
                    CancellationToken cancellationToken) =>
                {
                    if (string.IsNullOrWhiteSpace(appId) || appId.Length > 64)
                    {
                        return Results.BadRequest(new { error = "invalid-app-id" });
                    }

                    if (!TryParseSessionFreshness(body.Freshness, out var freshness))
                    {
                        return Results.BadRequest(new { error = "invalid-freshness" });
                    }

                    var app = await db.Apps.FirstOrDefaultAsync(a => a.Id == appId, cancellationToken)
                        .ConfigureAwait(false);
                    if (app is null)
                    {
                        return Results.NotFound(new { error = "app-not-found" });
                    }

                    var now = DateTime.UtcNow;
                    app.SessionFreshness = freshness;
                    app.UpdatedAtUtc = now;
                    await db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
                    return Results.Ok(new AppSessionFreshnessResponse(app.Id, app.SessionFreshness.ToString(), app.UpdatedAtUtc));
                })
            .WithName("PutAppSessionFreshness")
            .WithTags("apps");

        app.MapPost(
                "/api/v1/launch",
                async (
                    LaunchRequestDto body,
                    ProcessLaunchService launcher,
                    CancellationToken cancellationToken) =>
                {
                    var outcome = await launcher
                        .LaunchAsync(body.AppId ?? string.Empty, cancellationToken)
                        .ConfigureAwait(false);
                    if (!outcome.Ok)
                    {
                        return Results.Json(
                            new { ok = false, reason = outcome.Reason },
                            statusCode: outcome.StatusCode);
                    }

                    return Results.Ok(
                        new { ok = true, sessionId = outcome.SessionId, pid = outcome.Pid });
                })
            .WithName("PostLaunch")
            .WithTags("launch");

        app.MapPost(
                "/api/v1/launch/media/{mediaItemId:guid}",
                async (
                    Guid mediaItemId,
                    ProcessLaunchService launcher,
                    CancellationToken cancellationToken) =>
                {
                    var outcome = await launcher
                        .LaunchMediaItemAsync(mediaItemId, cancellationToken)
                        .ConfigureAwait(false);
                    if (!outcome.Ok)
                    {
                        return Results.Json(
                            new { ok = false, reason = outcome.Reason },
                            statusCode: outcome.StatusCode);
                    }

                    return Results.Ok(
                        new { ok = true, sessionId = outcome.SessionId, pid = outcome.Pid });
                })
            .WithName("PostLaunchMedia")
            .WithTags("launch");

        app.MapGet(
                "/api/v1/launch/sessions/active",
                async (OrangeTvDbContext db, CancellationToken cancellationToken) =>
                {
                    var rows = await (
                            from s in db.LaunchSessions.AsNoTracking()
                            join a in db.Apps.AsNoTracking() on s.AppId equals a.Id
                            where s.EndedAtUtc == null
                            orderby s.StartedAtUtc
                            select new ActiveLaunchSessionItem(
                                s.Id,
                                s.AppId,
                                a.Label,
                                s.Pid,
                                s.StartedAtUtc,
                                LaunchKind(a.Type),
                                s.MediaItemId))
                        .ToListAsync(cancellationToken)
                        .ConfigureAwait(false);
                    return Results.Ok(new ActiveLaunchSessionsResponse(rows.ToArray()));
                })
            .WithName("GetActiveLaunchSessions")
            .WithTags("launch");

        app.MapPost(
                "/api/v1/launch/sessions/{sessionId:guid}/minimize",
                async (
                    Guid sessionId,
                    OrangeTvDbContext db,
                    IChildProcessWindowOrchestrator orchestrator,
                    CancellationToken cancellationToken) =>
                {
                    var session = await db.LaunchSessions.AsNoTracking()
                        .FirstOrDefaultAsync(s => s.Id == sessionId && s.EndedAtUtc == null, cancellationToken)
                        .ConfigureAwait(false);
                    if (session is null)
                    {
                        return Results.NotFound(new { error = "session-not-found" });
                    }

                    var result = await orchestrator.MinimizeAsync(session.Pid, cancellationToken).ConfigureAwait(false);
                    if (result.Reason == "unsupported-platform")
                    {
                        return Results.Json(
                            new { ok = false, reason = result.Reason },
                            statusCode: StatusCodes.Status501NotImplemented);
                    }

                    if (!result.Ok)
                    {
                        return Results.Ok(new { ok = false, reason = result.Reason ?? "minimize-failed" });
                    }

                    return Results.Ok(new { ok = true });
                })
            .WithName("PostLaunchSessionMinimize")
            .WithTags("launch");

        app.MapPost(
                "/api/v1/launch/sessions/{sessionId:guid}/foreground",
                async (
                    Guid sessionId,
                    OrangeTvDbContext db,
                    IChildProcessWindowOrchestrator orchestrator,
                    CancellationToken cancellationToken) =>
                {
                    var session = await db.LaunchSessions.AsNoTracking()
                        .FirstOrDefaultAsync(s => s.Id == sessionId && s.EndedAtUtc == null, cancellationToken)
                        .ConfigureAwait(false);
                    if (session is null)
                    {
                        return Results.NotFound(new { error = "session-not-found" });
                    }

                    var result = await orchestrator.ForegroundAsync(session.Pid, cancellationToken).ConfigureAwait(false);
                    if (result.Reason == "unsupported-platform")
                    {
                        return Results.Json(
                            new { ok = false, reason = result.Reason },
                            statusCode: StatusCodes.Status501NotImplemented);
                    }

                    if (!result.Ok)
                    {
                        return Results.Ok(new { ok = false, reason = result.Reason ?? "foreground-failed" });
                    }

                    return Results.Ok(new { ok = true });
                })
            .WithName("PostLaunchSessionForeground")
            .WithTags("launch");

        app.MapMediaEndpoints();
        app.MapWatchEndpoints();
        app.MapRecommendationEndpoints();
    }

    private sealed record LaunchRequestDto(string? AppId);

    private sealed record HealthResponse(string Status, string Database, DateTime TimestampUtc);

    private sealed record SettingsListResponse(SettingItemResponse[] Items);

    private sealed record SettingItemResponse(string Key, string? Value, DateTime UpdatedAtUtc);

    private sealed record PutSettingRequest(string? Value);

    private sealed record AppsListResponse(AppItemResponse[] Items);

    private sealed record AppItemResponse(
        string Id,
        string Label,
        string? Type,
        string? LaunchUrl,
        int SortOrder,
        DateTime CreatedAtUtc,
        DateTime UpdatedAtUtc,
        string? ChromeProfileSegment,
        string SessionFreshness,
        DateTime? LastSessionEndedAtUtc,
        int? LastSessionExitCode);

    private sealed record PutAppSessionFreshnessRequest(string? Freshness);

    private sealed record AppSessionFreshnessResponse(string Id, string SessionFreshness, DateTime UpdatedAtUtc);

    private sealed record HomeLayoutResponse(string Version, HomeRowLayout[] Rows);

    private sealed record HomeRowLayout(string Id, string Title, string[] DataSources);

    private sealed record ActiveLaunchSessionsResponse(ActiveLaunchSessionItem[] Items);

    private sealed record ActiveLaunchSessionItem(
        Guid SessionId,
        string AppId,
        string Label,
        int Pid,
        DateTime StartedAtUtc,
        string Kind,
        Guid? MediaItemId);
}
