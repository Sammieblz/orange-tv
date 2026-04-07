using OrangeTv.Api;
using Xunit;

namespace OrangeTv.Api.Tests;

public sealed class WeatherForecastTests
{
    [Theory]
    [InlineData(0, 32)]
    [InlineData(10, 49)]
    [InlineData(-20, -3)]
    public void TemperatureF_matches_formula(int temperatureC, int expectedF)
    {
        var row = new WeatherForecast(DateOnly.MinValue, temperatureC, "x");
        Assert.Equal(expectedF, row.TemperatureF);
    }
}
