using System.Runtime.InteropServices;
using OrangeTv.Api.Platform;
using Xunit;

namespace OrangeTv.Api.Tests.Platform;

public sealed class PlatformEnvironmentTests
{
    private readonly PlatformEnvironment _sut = new();

    [Fact]
    public void PreferredDirectorySeparator_is_forward_slash()
    {
        Assert.Equal('/', _sut.PreferredDirectorySeparator);
    }

    [Fact]
    public void IsWindows_and_IsLinux_match_RuntimeInformation()
    {
        if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
        {
            Assert.True(_sut.IsWindows);
            Assert.False(_sut.IsLinux);
        }
        else if (RuntimeInformation.IsOSPlatform(OSPlatform.Linux))
        {
            Assert.False(_sut.IsWindows);
            Assert.True(_sut.IsLinux);
        }
        else
        {
            Assert.False(_sut.IsWindows);
            Assert.False(_sut.IsLinux);
        }

        Assert.False(_sut.IsWindows && _sut.IsLinux);
    }

    [Fact]
    public void NormalizePath_null_returns_null()
    {
        Assert.Null(_sut.NormalizePath(null!));
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void NormalizePath_whitespace_only_returns_unchanged(string path)
    {
        Assert.Equal(path, _sut.NormalizePath(path));
    }

    [Fact]
    public void NormalizePath_trims_and_replaces_backslashes_and_trims_trailing_slash()
    {
        Assert.Equal("C:/Users/demo/file.txt", _sut.NormalizePath(@"  C:\Users\demo\file.txt  "));
        Assert.Equal("C:/Users/demo", _sut.NormalizePath(@"C:\Users\demo\"));
        Assert.Equal("C:/Users/demo", _sut.NormalizePath(@"C:\Users\demo/"));
    }
}
