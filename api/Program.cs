using System.Runtime.InteropServices;
using Microsoft.EntityFrameworkCore;
using OrangeTv.Api;
using OrangeTv.Api.Configuration;
using OrangeTv.Api.Data;
using OrangeTv.Api.Endpoints;
using OrangeTv.Api.Services;
using OrangeTv.Api.Platform;
using OrangeTv.Api.Library;
using OrangeTv.Api.Shell;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

builder.Host.UseSerilog(
    (context, services, configuration) =>
        configuration
            .ReadFrom.Configuration(context.Configuration)
            .ReadFrom.Services(services)
            .Enrich.FromLogContext());

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
builder.Services.Configure<OrangetvApiOptions>(builder.Configuration.GetSection(OrangetvApiOptions.SectionName));
builder.Services.AddSingleton<SqlitePathResolver>();
builder.Services.AddDbContext<OrangeTvDbContext>(
    (sp, ob) =>
    {
        var resolver = sp.GetRequiredService<SqlitePathResolver>();
        var path = resolver.Resolve();
        resolver.EnsureParentDirectoryExists(path);
        ob.UseSqlite($"Data Source={path}");
    });

builder.Services.AddSingleton<IPlatformEnvironment, PlatformEnvironment>();
builder.Services.Configure<BrowserShellOptions>(builder.Configuration.GetSection(BrowserShellOptions.SectionName));
builder.Services.AddHostedService<ChromiumShellHostedService>();
builder.Services.AddSingleton<ProcessLaunchService>();
builder.Services.AddSingleton<LibraryRootsResolver>();
builder.Services.AddSingleton<IMediaMetadataExtractor, FfProbeMediaMetadataExtractor>();
builder.Services.AddSingleton<IMediaThumbnailGenerator, FfmpegThumbnailGenerator>();
builder.Services.AddSingleton<LibraryScannerService>();
builder.Services.AddHostedService<LibraryScannerHostedService>();

var app = builder.Build();

await ApplyDatabaseAsync(app).ConfigureAwait(false);

if (app.Environment.IsDevelopment())
{
    app.UseCors("DevLauncher");
    app.MapOpenApi();
}
else if (!app.Environment.IsEnvironment("Testing"))
{
    app.UseHttpsRedirection();
}

var summaries = new[]
{
    "Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy", "Hot", "Sweltering", "Scorching",
};

app.MapGet(
        "/weatherforecast",
        () =>
        {
            var forecast = Enumerable.Range(1, 5).Select(index =>
                    new WeatherForecast(
                        DateOnly.FromDateTime(DateTime.Now.AddDays(index)),
                        Random.Shared.Next(-20, 55),
                        summaries[Random.Shared.Next(summaries.Length)]))
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

app.MapApiV1Endpoints();

try
{
    await app.RunAsync().ConfigureAwait(false);
}
finally
{
    Log.CloseAndFlush();
}

static async Task ApplyDatabaseAsync(WebApplication app)
{
    var logger = app.Services.GetRequiredService<ILoggerFactory>().CreateLogger("OrangeTv.Api.Startup");
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<OrangeTvDbContext>();
    var resolver = scope.ServiceProvider.GetRequiredService<SqlitePathResolver>();
    var path = resolver.Resolve();

    if (!app.Environment.IsEnvironment("Testing"))
    {
        logger.LogInformation("SQLite database path: {SqlitePath}", path);
    }

    try
    {
        await db.Database.MigrateAsync().ConfigureAwait(false);
        await DbSeeder.SeedAsync(db).ConfigureAwait(false);
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Database migration or seed failed.");
        throw;
    }
}

public partial class Program
{
}
