using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using OrangeTv.Api.Shell;
using Xunit;

namespace OrangeTv.Api.Tests.Shell;

public sealed class BrowserShellOptionsTests
{
    [Fact]
    public void Defaults_match_expected()
    {
        var o = new BrowserShellOptions();
        Assert.False(o.Enabled);
        Assert.Equal("http://localhost:5173", o.LauncherUrl);
        Assert.Null(o.ExecutablePath);
        Assert.Null(o.UserDataDir);
        Assert.True(o.UseAppMode);
        Assert.False(o.StartFullscreen);
        Assert.Equal(60, o.ReadyTimeoutSeconds);
        Assert.Equal(1000, o.ReadyPollIntervalMilliseconds);
    }

    [Fact]
    public void Binds_from_configuration_section()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(
                new Dictionary<string, string?>
                {
                    ["BrowserShell:Enabled"] = "true",
                    ["BrowserShell:LauncherUrl"] = "http://example:5173",
                    ["BrowserShell:UseAppMode"] = "false",
                    ["BrowserShell:ReadyTimeoutSeconds"] = "120",
                })
            .Build();

        var services = new ServiceCollection();
        services.Configure<BrowserShellOptions>(config.GetSection(BrowserShellOptions.SectionName));
        using var provider = services.BuildServiceProvider();
        var opt = provider.GetRequiredService<IOptions<BrowserShellOptions>>().Value;

        Assert.True(opt.Enabled);
        Assert.Equal("http://example:5173", opt.LauncherUrl);
        Assert.False(opt.UseAppMode);
        Assert.Equal(120, opt.ReadyTimeoutSeconds);
    }
}
