using OrangeTv.Api.Launch;
using OrangeTv.Api.Tests.Support;
using Xunit;

namespace OrangeTv.Api.Tests.Launch;

public sealed class MpvExecutableCandidatesTests
{
    [Fact]
    public void Enumerate_Windows_starts_with_mpv_exe()
    {
        var platform = new FakePlatformEnvironment { IsWindows = true, IsLinux = false };
        var list = MpvExecutableCandidates.Enumerate(platform).ToList();
        Assert.NotEmpty(list);
        Assert.Equal("mpv.exe", list[0]);
    }

    [Fact]
    public void Enumerate_Linux_yields_standard_paths()
    {
        var platform = new FakePlatformEnvironment { IsWindows = false, IsLinux = true };
        var list = MpvExecutableCandidates.Enumerate(platform).ToList();
        Assert.Equal("mpv", list[0]);
        Assert.Contains("/usr/bin/mpv", list);
    }
}
