using OrangeTv.Api.Launch;
using OrangeTv.Api.Platform;
using OrangeTv.Api.Tests.Support;
using Xunit;

namespace OrangeTv.Api.Tests.Launch;

public sealed class ChromeProfilePathsTests
{
    private static readonly IPlatformEnvironment Platform = new FakePlatformEnvironment
    {
        IsWindows = true,
        IsLinux = false,
    };

    [Fact]
    public void ResolveProfilesParent_uses_default_under_orange_root_when_unset()
    {
        var p = ChromeProfilePaths.ResolveProfilesParent(@"C:\OrangeTv", null, null, Platform);
        Assert.Equal(Path.Combine(@"C:\OrangeTv", "launch-chrome"), p);
    }

    [Fact]
    public void ResolveUserDataDir_uses_sanitized_app_id_when_segment_null()
    {
        var dir = ChromeProfilePaths.ResolveUserDataDir(
            @"C:\OrangeTv",
            null,
            null,
            "launch-streaming-demo",
            null,
            Platform);
        Assert.EndsWith(
            @"launch-chrome/launch-streaming-demo".Replace('/', Path.DirectorySeparatorChar),
            dir.Replace('\\', Path.DirectorySeparatorChar),
            StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void SanitizeSegment_replaces_invalid_chars()
    {
        Assert.Equal("a_b", ChromeProfilePaths.SanitizeSegment("a:b"));
    }
}
