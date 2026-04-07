using OrangeTv.Api.Shell;
using Xunit;

namespace OrangeTv.Api.Tests.Shell;

public sealed class BrowserShellChromeArgumentsTests
{
    private static readonly Uri LauncherUri = new("http://localhost:5173", UriKind.Absolute);

    [Fact]
    public void App_mode_emits_app_flag_and_stops_before_new_window()
    {
        var options = new BrowserShellOptions { UseAppMode = true, StartFullscreen = false };
        var args = BrowserShellChromeArguments.BuildArguments(LauncherUri, options, @"D:\profile").ToList();

        Assert.True(
            args.Exists(a => a.StartsWith("--app=http://localhost:5173", StringComparison.Ordinal)));
        Assert.DoesNotContain("--new-window", args);
    }

    [Fact]
    public void Non_app_mode_emits_new_window_and_url()
    {
        var options = new BrowserShellOptions { UseAppMode = false };
        var args = BrowserShellChromeArguments.BuildArguments(LauncherUri, options, @"D:\profile").ToList();

        Assert.Contains("--new-window", args);
        Assert.Contains("http://localhost:5173/", args);
        Assert.DoesNotContain("--app=", args);
    }

    [Fact]
    public void StartFullscreen_adds_flag()
    {
        var options = new BrowserShellOptions { UseAppMode = true, StartFullscreen = true };
        var args = BrowserShellChromeArguments.BuildArguments(LauncherUri, options, @"D:\profile").ToList();

        Assert.Contains("--start-fullscreen", args);
    }

    [Fact]
    public void Includes_user_data_dir_and_standard_flags()
    {
        var options = new BrowserShellOptions();
        var args = BrowserShellChromeArguments.BuildArguments(LauncherUri, options, @"D:\profile").ToList();

        Assert.Contains("--user-data-dir=D:\\profile", args);
        Assert.Contains("--no-first-run", args);
        Assert.Contains("--no-default-browser-check", args);
        Assert.Contains("--disable-session-crashed-bubble", args);
    }
}
