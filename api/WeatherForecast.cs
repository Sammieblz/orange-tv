namespace OrangeTv.Api;

/// <summary>
/// Template weather row returned by <c>/weatherforecast</c>.
/// </summary>
public sealed record WeatherForecast(DateOnly Date, int TemperatureC, string? Summary)
{
    public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
}
