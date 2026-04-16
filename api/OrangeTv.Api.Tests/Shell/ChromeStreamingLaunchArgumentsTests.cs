using OrangeTv.Api.Shell;
using Xunit;

namespace OrangeTv.Api.Tests.Shell;

public sealed class ChromeStreamingLaunchArgumentsTests
{
    [Fact]
    public void App_window_mode_uses_app_flag_not_new_window()
    {
        var args = ChromeStreamingLaunchArguments.Build(
                "https://www.netflix.com",
                @"C:\profiles\netflix",
                useAppWindow: true,
                startFullscreen: false)
            .ToList();

        Assert.Contains("--app=https://www.netflix.com", args);
        Assert.DoesNotContain("--new-window", args);
        Assert.Contains("--user-data-dir=C:\\profiles\\netflix", args);
        Assert.Contains("--disable-infobars", args);
    }

    [Fact]
    public void StartFullscreen_adds_flag_before_app()
    {
        var args = ChromeStreamingLaunchArguments.Build(
                "https://example.com",
                "/tmp/p",
                useAppWindow: true,
                startFullscreen: true)
            .ToList();

        var iFull = args.IndexOf("--start-fullscreen");
        var iApp = args.FindIndex(a => a.StartsWith("--app=", StringComparison.Ordinal));
        Assert.True(iFull >= 0 && iApp > iFull);
    }

    [Fact]
    public void Legacy_browser_window_uses_new_window_and_url()
    {
        var args = ChromeStreamingLaunchArguments.Build(
                "https://example.com",
                "/tmp/p",
                useAppWindow: false,
                startFullscreen: false)
            .ToList();

        Assert.Contains("--new-window", args);
        Assert.Contains("https://example.com", args);
        Assert.False(args.Any(a => a.StartsWith("--app=", StringComparison.Ordinal)));
    }
}
