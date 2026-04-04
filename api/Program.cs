using System.Runtime.InteropServices;
using OrangeTv.Api.Platform;
using OrangeTv.Api.Shell;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();
builder.Services.AddCors(options =>
{
    options.AddPolicy(
        "DevLauncher",
        policy =>
        {
            policy.WithOrigins("http://localhost:5173", "http://127.0.0.1:5173")
                .AllowAnyHeader()
                .AllowAnyMethod();
        });
});
builder.Services.AddSingleton<IPlatformEnvironment, PlatformEnvironment>();
builder.Services.Configure<BrowserShellOptions>(builder.Configuration.GetSection(BrowserShellOptions.SectionName));
builder.Services.AddHostedService<ChromiumShellHostedService>();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseCors("DevLauncher");
    app.MapOpenApi();
}
else
{
    app.UseHttpsRedirection();
}

var summaries = new[]
{
    "Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy", "Hot", "Sweltering", "Scorching"
};

app.MapGet("/weatherforecast", () =>
{
    var forecast =  Enumerable.Range(1, 5).Select(index =>
        new WeatherForecast
        (
            DateOnly.FromDateTime(DateTime.Now.AddDays(index)),
            Random.Shared.Next(-20, 55),
            summaries[Random.Shared.Next(summaries.Length)]
        ))
        .ToArray();
    return forecast;
})
.WithName("GetWeatherForecast");

app.MapGet(
        "/api/v1/system/platform",
        (IPlatformEnvironment platform) =>
            Results.Ok(
                new
                {
                    osDescription = RuntimeInformation.OSDescription,
                    frameworkDescription = RuntimeInformation.FrameworkDescription,
                    platform.IsWindows,
                    platform.IsLinux,
                    platform.PreferredDirectorySeparator,
                    sampleNormalizedPath = platform.NormalizePath(@"C:\Users\demo\file.txt"),
                }))
    .WithName("GetPlatform");

app.Run();

record WeatherForecast(DateOnly Date, int TemperatureC, string? Summary)
{
    public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
}
