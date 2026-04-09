using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using OrangeTv.Api.Data;
using OrangeTv.Api.Data.Entities;
using OrangeTv.Api.Tests.Support;
using Xunit;

namespace OrangeTv.Api.Tests.Endpoints;

public sealed class RecommendationEndpointsTests : IClassFixture<ApiWebApplicationFactory>, IDisposable
{
    private readonly ApiWebApplicationFactory _factory;
    private readonly HttpClient _client;
    private readonly JsonSerializerOptions _jsonOptions = new(JsonSerializerDefaults.Web);

    public RecommendationEndpointsTests(ApiWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Get_recommendations_home_returns_rules_engine_and_rows()
    {
        var response = await _client.GetAsync(
            "/api/v1/recommendations/home?recentTake=2&topAppsTake=2&genreTake=0&localHour=20");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var doc = await response.Content.ReadFromJsonAsync<JsonElement>(_jsonOptions, CancellationToken.None);
        Assert.Equal("rules", doc.GetProperty("engine").GetString());
        Assert.Equal("none", doc.GetProperty("mlRanker").GetString());
        Assert.True(doc.TryGetProperty("rows", out var rows));
        Assert.True(rows.GetArrayLength() >= 2);
    }

    [Fact]
    public async Task Get_recommendations_home_recent_orders_by_last_activity_then_media_id()
    {
        var idA = Guid.Parse("00000000-0000-0000-0000-0000000000a1");
        var idB = Guid.Parse("80000000-0000-0000-0000-0000000000b2");
        await SeedMediaAsync(idA);
        await SeedMediaAsync(idB);
        var tOld = DateTime.UtcNow.AddYears(-1);
        var tNew = DateTime.UtcNow;
        await AddWatchEvent(idA, WatchEventType.PlaybackStarted, tOld);
        await AddWatchEvent(idB, WatchEventType.PlaybackStarted, tNew);

        var response = await _client.GetAsync("/api/v1/recommendations/home?recentTake=10&topAppsTake=0&genreTake=0&localHour=12");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var doc = await response.Content.ReadFromJsonAsync<JsonElement>(_jsonOptions, CancellationToken.None);
        var rows = doc.GetProperty("rows");
        var recent = rows.EnumerateArray().First(r => r.GetProperty("rowId").GetString() == "recent");
        var items = recent.GetProperty("items");
        var order = items.EnumerateArray().Select(x => x.GetProperty("mediaItemId").GetGuid()).ToList();
        var posA = order.IndexOf(idA);
        var posB = order.IndexOf(idB);
        Assert.True(posA >= 0 && posB >= 0);
        Assert.True(posB < posA, "Newer activity should sort before older.");
    }

    [Fact]
    public async Task Get_recommendations_home_top_apps_orders_by_count_then_app_id()
    {
        await SeedAppAsync("z-top-sort", "Z");
        await SeedAppAsync("a-top-sort", "A");
        var since = DateTime.UtcNow.AddDays(-1);
        await AddWatchEvent("a-top-sort", WatchEventType.AppLaunched, since);
        await AddWatchEvent("a-top-sort", WatchEventType.AppLaunched, since);
        await AddWatchEvent("z-top-sort", WatchEventType.AppLaunched, since);
        await AddWatchEvent("z-top-sort", WatchEventType.AppLaunched, since);

        var response = await _client.GetAsync("/api/v1/recommendations/home?recentTake=0&topAppsTake=20&genreTake=0&localHour=12");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var doc = await response.Content.ReadFromJsonAsync<JsonElement>(_jsonOptions, CancellationToken.None);
        var rows = doc.GetProperty("rows");
        var top = rows.EnumerateArray().First(r => r.GetProperty("rowId").GetString() == "top-apps");
        var items = top.GetProperty("items");
        var ids = items.EnumerateArray().Select(x => x.GetProperty("appId").GetString()).ToList();
        var iA = ids.IndexOf("a-top-sort");
        var iZ = ids.IndexOf("z-top-sort");
        Assert.True(iA >= 0 && iZ >= 0);
        Assert.True(iA < iZ, "Equal counts should order by AppId ascending.");
    }

    private async Task SeedMediaAsync(Guid id)
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<OrangeTvDbContext>();
        var now = DateTime.UtcNow;
        db.MediaItems.Add(
            new MediaItemEntity
            {
                Id = id,
                FilePath = Path.Combine(Path.GetTempPath(), $"rec-test-{id:N}.mp4"),
                FileSizeBytes = 1,
                FileModifiedAtUtc = now,
                LastScannedAtUtc = now,
                CreatedAtUtc = now,
                UpdatedAtUtc = now,
            });
        await db.SaveChangesAsync();
    }

    private async Task SeedAppAsync(string id, string label)
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<OrangeTvDbContext>();
        if (await db.Apps.AnyAsync(a => a.Id == id))
        {
            return;
        }

        var now = DateTime.UtcNow;
        db.Apps.Add(
            new AppEntity
            {
                Id = id,
                Label = label,
                Type = "chrome",
                LaunchUrl = "https://example.com",
                SortOrder = 100,
                CreatedAtUtc = now,
                UpdatedAtUtc = now,
            });
        await db.SaveChangesAsync();
    }

    private async Task AddWatchEvent(Guid mediaId, WatchEventType type, DateTime at)
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<OrangeTvDbContext>();
        db.WatchEvents.Add(
            new WatchEventEntity
            {
                Id = Guid.NewGuid(),
                OccurredAtUtc = at,
                EventType = type,
                MediaItemId = mediaId,
            });
        await db.SaveChangesAsync();
    }

    private async Task AddWatchEvent(string appId, WatchEventType type, DateTime at)
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<OrangeTvDbContext>();
        db.WatchEvents.Add(
            new WatchEventEntity
            {
                Id = Guid.NewGuid(),
                OccurredAtUtc = at,
                EventType = type,
                AppId = appId,
            });
        await db.SaveChangesAsync();
    }

    public void Dispose()
    {
        _client.Dispose();
    }
}
