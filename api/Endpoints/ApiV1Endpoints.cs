using Microsoft.EntityFrameworkCore;
using OrangeTv.Api.Data;
using OrangeTv.Api.Data.Entities;
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

        app.MapMediaEndpoints();
        app.MapWatchEndpoints();
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
}
