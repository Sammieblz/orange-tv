using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;

namespace OrangeTv.Api.Tests.Support;

/// <summary>
/// Uses environment "Testing" so the Chromium shell hosted service does not run (not Development)
/// and HTTPS redirection is skipped (see Program.cs).
/// </summary>
public sealed class ApiWebApplicationFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
    }
}
