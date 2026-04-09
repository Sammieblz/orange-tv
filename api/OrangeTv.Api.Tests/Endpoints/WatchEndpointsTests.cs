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

public sealed class WatchEndpointsTests : IClassFixture<ApiWebApplicationFactory>, IDisposable
{
    private readonly ApiWebApplicationFactory _factory;
    private readonly HttpClient _client;
    private readonly JsonSerializerOptions _jsonOptions = new(JsonSerializerDefaults.Web);

    public WatchEndpointsTests(ApiWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Get_watch_continue_returns_empty_items()
    {
        var response = await _client.GetAsync("/api/v1/watch/continue");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var doc = await response.Content.ReadFromJsonAsync<JsonElement>(_jsonOptions, CancellationToken.None);
        Assert.True(doc.TryGetProperty("items", out var items));
        Assert.Equal(JsonValueKind.Array, items.ValueKind);
    }

    [Fact]
    public async Task Post_watch_events_invalid_event_type_returns_400()
    {
        var res = await _client.PostAsJsonAsync(
            "/api/v1/watch/events",
            new { eventType = "NotARealType", mediaItemId = Guid.NewGuid() },
            _jsonOptions,
            CancellationToken.None);
        Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);
    }

    [Fact]
    public async Task Post_watch_events_unknown_media_returns_400()
    {
        var res = await _client.PostAsJsonAsync(
            "/api/v1/watch/events",
            new
            {
                eventType = "PlaybackProgress",
                mediaItemId = Guid.NewGuid(),
                positionSeconds = 1.0,
                durationSeconds = 10.0,
            },
            _jsonOptions,
            CancellationToken.None);
        Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);
    }

    [Fact]
    public async Task Get_watch_continue_excludes_items_at_or_above_98_percent_progress()
    {
        var mediaId = Guid.NewGuid();
        await SeedMediaItemAsync(mediaId, durationSeconds: 100);
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<OrangeTvDbContext>();
            var t = DateTime.UtcNow;
            db.MediaResumes.Add(
                new MediaResumeEntity
                {
                    MediaItemId = mediaId,
                    PositionSeconds = 99,
                    DurationSeconds = 100,
                    LastPlayedAtUtc = t,
                    UpdatedAtUtc = t,
                });
            await db.SaveChangesAsync();
        }

        var response = await _client.GetAsync("/api/v1/watch/continue?take=100");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var doc = await response.Content.ReadFromJsonAsync<JsonElement>(_jsonOptions, CancellationToken.None);
        var items = doc.GetProperty("items");
        foreach (var item in items.EnumerateArray())
        {
            Assert.NotEqual(mediaId, item.GetProperty("mediaItemId").GetGuid());
        }
    }

    [Fact]
    public async Task Get_watch_history_returns_total_and_items()
    {
        var response = await _client.GetAsync("/api/v1/watch/history?take=5");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var doc = await response.Content.ReadFromJsonAsync<JsonElement>(_jsonOptions, CancellationToken.None);
        Assert.True(doc.TryGetProperty("total", out _));
        Assert.True(doc.TryGetProperty("items", out var items));
        Assert.Equal(JsonValueKind.Array, items.ValueKind);
    }

    [Fact]
    public async Task Post_watch_events_playback_progress_upserts_media_resume()
    {
        var mediaId = Guid.NewGuid();
        await SeedMediaItemAsync(mediaId, durationSeconds: 100);

        var res = await _client.PostAsJsonAsync(
            "/api/v1/watch/events",
            new
            {
                eventType = "PlaybackProgress",
                mediaItemId = mediaId,
                positionSeconds = 12.5,
                durationSeconds = 100.0,
            },
            _jsonOptions,
            CancellationToken.None);
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<OrangeTvDbContext>();
        var row = await db.MediaResumes.AsNoTracking().FirstOrDefaultAsync(r => r.MediaItemId == mediaId);
        Assert.NotNull(row);
        Assert.Equal(12.5, row!.PositionSeconds, precision: 5);
        Assert.Equal(100, row.DurationSeconds, precision: 5);
    }

    [Fact]
    public async Task Get_watch_continue_orders_by_LastPlayedAtUtc_desc_then_MediaItemId_asc()
    {
        var idLow = Guid.Parse("00000000-0000-0000-0000-000000000001");
        var idHigh = Guid.Parse("80000000-0000-0000-0000-000000000001");
        var same = DateTime.UtcNow.AddDays(7);
        await SeedMediaItemAsync(idLow, durationSeconds: 100);
        await SeedMediaItemAsync(idHigh, durationSeconds: 100);

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<OrangeTvDbContext>();
            db.MediaResumes.AddRange(
                new MediaResumeEntity
                {
                    MediaItemId = idHigh,
                    PositionSeconds = 10,
                    DurationSeconds = 100,
                    LastPlayedAtUtc = same,
                    UpdatedAtUtc = same,
                },
                new MediaResumeEntity
                {
                    MediaItemId = idLow,
                    PositionSeconds = 10,
                    DurationSeconds = 100,
                    LastPlayedAtUtc = same,
                    UpdatedAtUtc = same,
                });
            await db.SaveChangesAsync();
        }

        var response = await _client.GetAsync("/api/v1/watch/continue?take=10");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var doc = await response.Content.ReadFromJsonAsync<JsonElement>(_jsonOptions, CancellationToken.None);
        var items = doc.GetProperty("items");
        Assert.Equal(2, items.GetArrayLength());
        Assert.Equal(idLow, items[0].GetProperty("mediaItemId").GetGuid());
        Assert.Equal(idHigh, items[1].GetProperty("mediaItemId").GetGuid());
    }

    private async Task SeedMediaItemAsync(Guid id, double durationSeconds)
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<OrangeTvDbContext>();
        var now = DateTime.UtcNow;
        db.MediaItems.Add(
            new MediaItemEntity
            {
                Id = id,
                FilePath = Path.Combine(Path.GetTempPath(), $"orange-tv-watch-test-{id:N}.mp4"),
                FileSizeBytes = 1,
                FileModifiedAtUtc = now,
                LastScannedAtUtc = now,
                CreatedAtUtc = now,
                UpdatedAtUtc = now,
                DurationSeconds = durationSeconds,
            });
        await db.SaveChangesAsync();
    }

    public void Dispose()
    {
        _client.Dispose();
    }
}
