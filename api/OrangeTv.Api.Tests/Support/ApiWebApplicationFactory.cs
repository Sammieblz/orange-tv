using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace OrangeTv.Api.Tests.Support;

/// <summary>
/// Uses environment "Testing" so the Chromium shell hosted service does not run (not Development)
/// and HTTPS redirection is skipped (see Program.cs). SQLite uses an isolated temp file per factory instance.
/// </summary>
public sealed class ApiWebApplicationFactory : WebApplicationFactory<Program>
{
    private readonly string _sqlitePath = Path.Combine(Path.GetTempPath(), $"orange-tv-test-{Guid.NewGuid():N}.db");

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.ConfigureAppConfiguration(
            (_, config) =>
            {
                config.AddInMemoryCollection(
                    new Dictionary<string, string?>
                    {
                        ["ORANGETV_API:Data:SqlitePath"] = _sqlitePath,
                    });
            });
        builder.ConfigureServices(
            services =>
            {
                if (services.All(d => d.ServiceType != typeof(IMemoryCache)))
                {
                    services.AddMemoryCache();
                }
            });
    }

    protected override void Dispose(bool disposing)
    {
        if (disposing)
        {
            try
            {
                if (File.Exists(_sqlitePath))
                {
                    File.Delete(_sqlitePath);
                }
            }
            catch
            {
                // best-effort cleanup of temp DB
            }
        }

        base.Dispose(disposing);
    }
}
