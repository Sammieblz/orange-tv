using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using OrangeTv.Api.Platform;
using OrangeTv.Api.Tests.Support;
using Xunit;

namespace OrangeTv.Api.Tests.Endpoints;

public sealed class MinimalApiIntegrationTests : IClassFixture<ApiWebApplicationFactory>
{
    private readonly HttpClient _client;
    private readonly JsonSerializerOptions _jsonOptions = new(JsonSerializerDefaults.Web);

    public MinimalApiIntegrationTests(ApiWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GetWeatherForecast_returns_five_items_with_expected_shape()
    {
        var response = await _client.GetAsync("/weatherforecast");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var stream = await response.Content.ReadAsStreamAsync();
        var forecast = await JsonSerializer.DeserializeAsync<WeatherForecastDto[]>(
            stream,
            _jsonOptions,
            CancellationToken.None);
        Assert.NotNull(forecast);
        Assert.Equal(5, forecast.Length);
        foreach (var item in forecast)
        {
            Assert.NotEqual(default, item.Date);
            Assert.InRange(item.TemperatureC, -20, 54);
            Assert.NotNull(item.Summary);
        }
    }

    [Fact]
    public async Task GetPlatform_returns_json_with_expected_properties_and_normalized_path()
    {
        var response = await _client.GetAsync("/api/v1/system/platform");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var payload = await response.Content.ReadFromJsonAsync<PlatformResponse>(_jsonOptions, CancellationToken.None);
        Assert.NotNull(payload);
        Assert.False(string.IsNullOrEmpty(payload.OsDescription));
        Assert.False(string.IsNullOrEmpty(payload.FrameworkDescription));
        Assert.Equal('/', payload.PreferredDirectorySeparator);

        var expected = new PlatformEnvironment().NormalizePath(@"C:\Users\demo\file.txt");
        Assert.Equal(expected, payload.SampleNormalizedPath);
    }

    private sealed record WeatherForecastDto(
        DateOnly Date,
        int TemperatureC,
        string? Summary,
        int TemperatureF);

    private sealed record PlatformResponse(
        string OsDescription,
        string FrameworkDescription,
        bool IsWindows,
        bool IsLinux,
        char PreferredDirectorySeparator,
        string SampleNormalizedPath);
}
