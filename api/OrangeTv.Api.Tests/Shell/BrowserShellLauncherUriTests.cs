using OrangeTv.Api.Shell;
using Xunit;

namespace OrangeTv.Api.Tests.Shell;

public sealed class BrowserShellLauncherUriTests
{
    [Theory]
    [InlineData("http://localhost:5173")]
    [InlineData("https://127.0.0.1:8080/path")]
    public void TryCreateAbsolute_succeeds_for_absolute_urls(string url)
    {
        var ok = BrowserShellLauncherUri.TryCreateAbsolute(url, out var uri);
        Assert.True(ok);
        Assert.NotNull(uri);
        Assert.True(uri!.IsAbsoluteUri);
    }

    [Theory]
    [InlineData("")]
    [InlineData("relative")]
    [InlineData("://bad")]
    public void TryCreateAbsolute_fails_for_invalid_urls(string url)
    {
        var ok = BrowserShellLauncherUri.TryCreateAbsolute(url, out var uri);
        Assert.False(ok);
        Assert.Null(uri);
    }
}
