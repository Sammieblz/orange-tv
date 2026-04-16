using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using OrangeTv.Api.Launch;
using OrangeTv.Api.Tests.Support;
using Xunit;

namespace OrangeTv.Api.Tests.Endpoints;

public sealed class ControlPlaneEndpointsTests : IClassFixture<ApiWebApplicationFactory>, IDisposable
{
    private readonly HttpClient _client;
    private readonly JsonSerializerOptions _jsonOptions = new(JsonSerializerDefaults.Web);

    public ControlPlaneEndpointsTests(ApiWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GetHealth_returns_ok_and_database_ok()
    {
        var response = await _client.GetAsync("/api/v1/health");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var payload = await response.Content.ReadFromJsonAsync<HealthResponse>(_jsonOptions, CancellationToken.None);
        Assert.NotNull(payload);
        Assert.Equal("ok", payload.Status);
        Assert.Equal("ok", payload.Database);
    }

    [Fact]
    public async Task GetSettings_returns_ok_with_items_array()
    {
        var response = await _client.GetAsync("/api/v1/settings");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var payload = await response.Content.ReadFromJsonAsync<SettingsListResponse>(_jsonOptions, CancellationToken.None);
        Assert.NotNull(payload);
        Assert.NotNull(payload.Items);
    }

    [Fact]
    public async Task PutSetting_then_GetSettings_includes_entry()
    {
        var put = await _client.PutAsJsonAsync(
            "/api/v1/settings/theme",
            new { value = "dark" },
            _jsonOptions,
            CancellationToken.None);
        Assert.Equal(HttpStatusCode.OK, put.StatusCode);

        var get = await _client.GetAsync("/api/v1/settings");
        Assert.Equal(HttpStatusCode.OK, get.StatusCode);
        var list = await get.Content.ReadFromJsonAsync<SettingsListResponse>(_jsonOptions, CancellationToken.None);
        Assert.NotNull(list);
        Assert.Contains(list.Items, i => i.Key == "theme" && i.Value == "dark");
    }

    [Fact]
    public async Task GetHome_returns_row_layout_contract()
    {
        var response = await _client.GetAsync("/api/v1/home");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var payload = await response.Content.ReadFromJsonAsync<HomeLayoutResponse>(_jsonOptions, CancellationToken.None);
        Assert.NotNull(payload);
        Assert.Equal("home-v1", payload.Version);
        Assert.NotNull(payload.Rows);
        Assert.Equal(7, payload.Rows.Length);
        Assert.Contains(payload.Rows, r => r.Id == "continue");
        Assert.Contains(payload.Rows, r => r.Id == "streaming");
        Assert.All(payload.Rows, r => Assert.NotEmpty(r.DataSources));
    }

    [Fact]
    public async Task GetApps_returns_seed_rows()
    {
        var response = await _client.GetAsync("/api/v1/apps");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var payload = await response.Content.ReadFromJsonAsync<AppsListResponse>(_jsonOptions, CancellationToken.None);
        Assert.NotNull(payload);
        Assert.NotNull(payload.Items);
        Assert.Equal(7, payload.Items.Length);
        Assert.Equal("launch-streaming-demo", payload.Items[0].Id);
        Assert.Equal("launch-mpv-demo", payload.Items[1].Id);
        Assert.Equal("netflix", payload.Items[2].Id);
        Assert.Equal("prime-video", payload.Items[3].Id);
        Assert.Equal("disney-plus", payload.Items[4].Id);
        Assert.Equal("youtube", payload.Items[5].Id);
        Assert.Equal(LocalMediaAppConstants.AppId, payload.Items[6].Id);
        Assert.NotNull(payload.Items[0].SessionFreshness);
    }

    [Fact]
    public async Task PutAppSessionFreshness_updates_app_row()
    {
        var put = await _client.PutAsJsonAsync(
            "/api/v1/apps/launch-streaming-demo/session-freshness",
            new { freshness = "PossiblyStale" },
            _jsonOptions,
            CancellationToken.None);
        Assert.Equal(HttpStatusCode.OK, put.StatusCode);

        var get = await _client.GetAsync("/api/v1/apps");
        Assert.Equal(HttpStatusCode.OK, get.StatusCode);
        var list = await get.Content.ReadFromJsonAsync<AppsListResponse>(_jsonOptions, CancellationToken.None);
        Assert.NotNull(list);
        var app = Assert.Single(list!.Items, i => i.Id == "launch-streaming-demo");
        Assert.Equal("PossiblyStale", app.SessionFreshness);

        await _client.PutAsJsonAsync(
            "/api/v1/apps/launch-streaming-demo/session-freshness",
            new { freshness = "Unknown" },
            _jsonOptions,
            CancellationToken.None);
    }

    [Fact]
    public async Task PutAppSessionFreshness_unknown_app_returns_404()
    {
        var put = await _client.PutAsJsonAsync(
            "/api/v1/apps/missing-app/session-freshness",
            new { freshness = "LikelyActive" },
            _jsonOptions,
            CancellationToken.None);
        Assert.Equal(HttpStatusCode.NotFound, put.StatusCode);
    }

    [Fact]
    public async Task PostLaunch_unknown_app_returns_404()
    {
        var response = await _client.PostAsJsonAsync(
            "/api/v1/launch",
            new { appId = "does-not-exist" },
            _jsonOptions,
            CancellationToken.None);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        var doc = await response.Content.ReadFromJsonAsync<JsonElement>(_jsonOptions, CancellationToken.None);
        Assert.True(doc.TryGetProperty("ok", out var ok));
        Assert.False(ok.GetBoolean());
        Assert.True(doc.TryGetProperty("reason", out var reason));
        Assert.Equal("app-not-found", reason.GetString());
    }

    [Fact]
    public async Task PostLaunch_empty_app_id_returns_400()
    {
        var response = await _client.PostAsJsonAsync(
            "/api/v1/launch",
            new { appId = "" },
            _jsonOptions,
            CancellationToken.None);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var doc = await response.Content.ReadFromJsonAsync<JsonElement>(_jsonOptions, CancellationToken.None);
        Assert.True(doc.TryGetProperty("ok", out var ok));
        Assert.False(ok.GetBoolean());
        Assert.True(doc.TryGetProperty("reason", out var reason));
        Assert.Equal("invalid-app-id", reason.GetString());
    }

    [Fact]
    public async Task GetHealth_response_includes_status_database_and_timestamp()
    {
        var response = await _client.GetAsync("/api/v1/health");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var doc = await response.Content.ReadFromJsonAsync<JsonElement>(_jsonOptions, CancellationToken.None);
        Assert.True(doc.TryGetProperty("status", out var status));
        Assert.Equal("ok", status.GetString());
        Assert.True(doc.TryGetProperty("database", out var database));
        Assert.Equal("ok", database.GetString());
        Assert.True(doc.TryGetProperty("timestampUtc", out var ts));
        Assert.True(ts.GetDateTime() <= DateTime.UtcNow.AddMinutes(1));
    }

    [Theory]
    [InlineData("%20")]
    [InlineData("%09")]
    public async Task PutSetting_whitespace_only_key_returns_bad_request(string encodedKeySegment)
    {
        var response = await _client.PutAsJsonAsync(
            $"/api/v1/settings/{encodedKeySegment}",
            new { value = "x" },
            _jsonOptions,
            CancellationToken.None);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task PutSetting_key_longer_than_256_returns_bad_request()
    {
        var key = new string('a', 257);
        var response = await _client.PutAsJsonAsync(
            $"/api/v1/settings/{key}",
            new { value = "v" },
            _jsonOptions,
            CancellationToken.None);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task PutSetting_updates_existing_row()
    {
        const string path = "/api/v1/settings/ui.accent";
        await _client.PutAsJsonAsync(path, new { value = "orange" }, _jsonOptions, CancellationToken.None);
        var second = await _client.PutAsJsonAsync(path, new { value = "ember" }, _jsonOptions, CancellationToken.None);

        Assert.Equal(HttpStatusCode.OK, second.StatusCode);
        var body = await second.Content.ReadFromJsonAsync<SettingItemResponse>(_jsonOptions, CancellationToken.None);
        Assert.NotNull(body);
        Assert.Equal("ui.accent", body.Key);
        Assert.Equal("ember", body.Value);

        var list = await _client.GetFromJsonAsync<SettingsListResponse>("/api/v1/settings", _jsonOptions, CancellationToken.None);
        Assert.NotNull(list);
        var row = Assert.Single(list.Items, i => i.Key == "ui.accent");
        Assert.Equal("ember", row.Value);
    }

    [Fact]
    public async Task PutSetting_put_response_matches_get_settings_for_same_key()
    {
        await _client.PutAsJsonAsync(
            "/api/v1/settings/launcher.version",
            new { value = "1" },
            _jsonOptions,
            CancellationToken.None);

        var put = await _client.PutAsJsonAsync(
            "/api/v1/settings/launcher.version",
            new { value = "2" },
            _jsonOptions,
            CancellationToken.None);
        var fromPut = await put.Content.ReadFromJsonAsync<SettingItemResponse>(_jsonOptions, CancellationToken.None);

        var get = await _client.GetFromJsonAsync<SettingsListResponse>("/api/v1/settings", _jsonOptions, CancellationToken.None);
        var fromGet = Assert.Single(get!.Items, i => i.Key == "launcher.version");

        Assert.Equal(fromGet.Key, fromPut!.Key);
        Assert.Equal(fromGet.Value, fromPut.Value);
        Assert.Equal(fromGet.UpdatedAtUtc, fromPut.UpdatedAtUtc);
    }

    public void Dispose()
    {
        _client.Dispose();
    }

    private sealed record HealthResponse(string Status, string Database, DateTime TimestampUtc);

    private sealed record SettingsListResponse(SettingItemResponse[] Items);

    private sealed record SettingItemResponse(string Key, string? Value, DateTime UpdatedAtUtc);

    private sealed record HomeLayoutResponse(string Version, HomeRowLayout[] Rows);

    private sealed record HomeRowLayout(string Id, string Title, string[] DataSources);

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
}
