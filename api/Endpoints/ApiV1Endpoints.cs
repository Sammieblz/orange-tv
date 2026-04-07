using Microsoft.EntityFrameworkCore;
using OrangeTv.Api.Data;
using OrangeTv.Api.Data.Entities;

namespace OrangeTv.Api.Endpoints;

public static class ApiV1Endpoints
{
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
                                    a.UpdatedAtUtc))
                                .ToArray()));
                })
            .WithName("GetApps")
            .WithTags("apps");
    }

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
        DateTime UpdatedAtUtc);
}
