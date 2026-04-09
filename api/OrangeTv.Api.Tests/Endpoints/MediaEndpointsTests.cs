using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using OrangeTv.Api.Tests.Support;
using Xunit;

namespace OrangeTv.Api.Tests.Endpoints;

public sealed class MediaEndpointsTests : IClassFixture<ApiWebApplicationFactory>, IDisposable
{
    private readonly HttpClient _client;
    private readonly JsonSerializerOptions _jsonOptions = new(JsonSerializerDefaults.Web);

    public MediaEndpointsTests(ApiWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GetMediaItems_returns_empty_total()
    {
        var response = await _client.GetAsync("/api/v1/media/items");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var doc = await response.Content.ReadFromJsonAsync<JsonElement>(_jsonOptions, CancellationToken.None);
        Assert.Equal(0, doc.GetProperty("total").GetInt32());
        Assert.True(doc.TryGetProperty("items", out var items));
        Assert.Equal(JsonValueKind.Array, items.ValueKind);
    }

    [Fact]
    public async Task PostLibraryScan_returns_accepted()
    {
        var response = await _client.PostAsync("/api/v1/media/library/scan", null);
        Assert.Equal(HttpStatusCode.Accepted, response.StatusCode);
        var doc = await response.Content.ReadFromJsonAsync<JsonElement>(_jsonOptions, CancellationToken.None);
        Assert.True(doc.GetProperty("accepted").GetBoolean());
    }

    public void Dispose()
    {
        _client.Dispose();
    }
}
