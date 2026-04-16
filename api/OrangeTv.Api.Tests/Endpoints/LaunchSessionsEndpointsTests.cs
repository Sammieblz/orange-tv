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

public sealed class LaunchSessionsEndpointsTests : IClassFixture<ApiWebApplicationFactory>, IDisposable
{
    private readonly HttpClient _client;
    private readonly ApiWebApplicationFactory _factory;
    private readonly JsonSerializerOptions _jsonOptions = new(JsonSerializerDefaults.Web);

    public LaunchSessionsEndpointsTests(ApiWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    private async Task ClearLaunchSessionsAsync()
    {
        await using var scope = _factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<OrangeTvDbContext>();
        await db.LaunchSessions.ExecuteDeleteAsync(CancellationToken.None);
    }

    [Fact]
    public async Task GetActiveLaunchSessions_returns_empty_when_no_active_rows()
    {
        await ClearLaunchSessionsAsync();
        var response = await _client.GetAsync("/api/v1/launch/sessions/active");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var payload = await response.Content.ReadFromJsonAsync<ActiveLaunchSessionsResponse>(_jsonOptions, CancellationToken.None);
        Assert.NotNull(payload);
        Assert.Empty(payload!.Items);
    }

    [Fact]
    public async Task GetActiveLaunchSessions_returns_active_session_with_app_label()
    {
        await ClearLaunchSessionsAsync();
        var sessionId = Guid.NewGuid();
        await using (var scope = _factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<OrangeTvDbContext>();
            db.LaunchSessions.Add(
                new LaunchSessionEntity
                {
                    Id = sessionId,
                    AppId = "launch-streaming-demo",
                    Pid = 424242,
                    StartedAtUtc = DateTime.UtcNow,
                    EndedAtUtc = null,
                });
            await db.SaveChangesAsync(CancellationToken.None);
        }

        var response = await _client.GetAsync("/api/v1/launch/sessions/active");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var payload = await response.Content.ReadFromJsonAsync<ActiveLaunchSessionsResponse>(_jsonOptions, CancellationToken.None);
        Assert.NotNull(payload);
        var row = Assert.Single(payload!.Items);
        Assert.Equal(sessionId, row.SessionId);
        Assert.Equal("launch-streaming-demo", row.AppId);
        Assert.Equal("Open streaming (Chrome)", row.Label);
        Assert.Equal(424242, row.Pid);
        Assert.Equal("chrome", row.Kind);
    }

    [Fact]
    public async Task GetActiveLaunchSessions_excludes_ended_sessions()
    {
        await ClearLaunchSessionsAsync();
        var activeId = Guid.NewGuid();
        var endedId = Guid.NewGuid();
        await using (var scope = _factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<OrangeTvDbContext>();
            db.LaunchSessions.Add(
                new LaunchSessionEntity
                {
                    Id = activeId,
                    AppId = "launch-streaming-demo",
                    Pid = 1,
                    StartedAtUtc = DateTime.UtcNow,
                    EndedAtUtc = null,
                });
            db.LaunchSessions.Add(
                new LaunchSessionEntity
                {
                    Id = endedId,
                    AppId = "launch-streaming-demo",
                    Pid = 2,
                    StartedAtUtc = DateTime.UtcNow.AddMinutes(-1),
                    EndedAtUtc = DateTime.UtcNow,
                });
            await db.SaveChangesAsync(CancellationToken.None);
        }

        var response = await _client.GetAsync("/api/v1/launch/sessions/active");
        var payload = await response.Content.ReadFromJsonAsync<ActiveLaunchSessionsResponse>(_jsonOptions, CancellationToken.None);
        Assert.NotNull(payload);
        Assert.Single(payload!.Items);
        Assert.Equal(activeId, payload.Items[0].SessionId);
    }

    [Fact]
    public async Task PostMinimize_unknown_session_returns_404()
    {
        var response = await _client.PostAsync(
            $"/api/v1/launch/sessions/{Guid.NewGuid()}/minimize",
            null);
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task PostMinimize_unsupported_platform_returns_501_on_non_windows()
    {
        if (OperatingSystem.IsWindows())
        {
            return;
        }

        await ClearLaunchSessionsAsync();
        var sessionId = Guid.NewGuid();
        await using (var scope = _factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<OrangeTvDbContext>();
            db.LaunchSessions.Add(
                new LaunchSessionEntity
                {
                    Id = sessionId,
                    AppId = "launch-streaming-demo",
                    Pid = 1,
                    StartedAtUtc = DateTime.UtcNow,
                    EndedAtUtc = null,
                });
            await db.SaveChangesAsync(CancellationToken.None);
        }

        var response = await _client.PostAsync(
            $"/api/v1/launch/sessions/{sessionId}/minimize",
            null);
        Assert.Equal(HttpStatusCode.NotImplemented, response.StatusCode);
    }

    public void Dispose() => _client.Dispose();

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
