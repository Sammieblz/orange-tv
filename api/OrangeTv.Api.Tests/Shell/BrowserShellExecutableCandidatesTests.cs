using OrangeTv.Api.Shell;
using OrangeTv.Api.Tests.Support;
using Xunit;

namespace OrangeTv.Api.Tests.Shell;

public sealed class BrowserShellExecutableCandidatesTests
{
    [Fact]
    public void Custom_ExecutablePath_is_first()
    {
        var options = new BrowserShellOptions { ExecutablePath = @"C:\bin\chrome.exe" };
        var platform = new FakePlatformEnvironment { IsLinux = true };

        var list = BrowserShellExecutableCandidates.Enumerate(options, platform).ToList();

        Assert.Equal(@"C:\bin\chrome.exe", list[0]);
        Assert.Contains("chromium-browser", list);
    }

    [Fact]
    public void Linux_only_lists_linux_candidates_after_optional_custom()
    {
        var options = new BrowserShellOptions();
        var platform = new FakePlatformEnvironment { IsLinux = true };

        var list = BrowserShellExecutableCandidates.Enumerate(options, platform).ToList();

        Assert.Equal(
            new[] { "chromium-browser", "chromium", "google-chrome", "google-chrome-stable" },
            list);
    }

    [Fact]
    public void Windows_includes_chrome_exe_and_typical_paths()
    {
        var options = new BrowserShellOptions();
        var platform = new FakePlatformEnvironment { IsWindows = true };

        var list = BrowserShellExecutableCandidates.Enumerate(options, platform).ToList();

        Assert.StartsWith("chrome.exe", list[0], StringComparison.Ordinal);
        Assert.True(
            list.Exists(p =>
                p.Contains("Google", StringComparison.OrdinalIgnoreCase)
                && p.EndsWith("chrome.exe", StringComparison.OrdinalIgnoreCase)));
    }

    [Fact]
    public void Non_windows_non_linux_lists_generic_fallback()
    {
        var options = new BrowserShellOptions();
        var platform = new FakePlatformEnvironment { IsWindows = false, IsLinux = false };

        var list = BrowserShellExecutableCandidates.Enumerate(options, platform).ToList();

        Assert.Equal(
            new[] { "chromium-browser", "chromium", "google-chrome" },
            list);
    }

    [Fact]
    public void EnumerateWindowsChromePaths_respects_provided_roots()
    {
        var list = BrowserShellExecutableCandidates.EnumerateWindowsChromePaths(
                @"C:\Program Files",
                @"C:\Program Files (x86)",
                @"C:\Users\Me\AppData\Local")
            .ToList();

        Assert.Equal("chrome.exe", list[0]);
        Assert.Contains(@"C:\Program Files\Google\Chrome\Application\chrome.exe", list);
        Assert.Contains(@"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe", list);
        Assert.Contains(@"C:\Users\Me\AppData\Local\Google\Chrome\Application\chrome.exe", list);
    }

    [Fact]
    public void EnumerateWindowsChromePaths_skips_empty_roots()
    {
        var list = BrowserShellExecutableCandidates.EnumerateWindowsChromePaths(
                null,
                "",
                "   ")
            .ToList();

        Assert.Single(list);
        Assert.Equal("chrome.exe", list[0]);
    }
}
