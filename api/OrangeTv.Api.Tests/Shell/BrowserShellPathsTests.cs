using OrangeTv.Api.Shell;
using Xunit;

namespace OrangeTv.Api.Tests.Shell;

public sealed class BrowserShellPathsTests
{
    [Fact]
    public void GetOrangeTvDataRoot_uses_localAppData_when_present()
    {
        var root = BrowserShellPaths.GetOrangeTvDataRoot(@"C:\Users\X\AppData\Local", @"C:\Users\X");
        Assert.Equal(Path.Combine(@"C:\Users\X\AppData\Local", "OrangeTv"), root);
    }

    [Fact]
    public void GetOrangeTvDataRoot_falls_back_to_user_profile_when_local_empty()
    {
        var root = BrowserShellPaths.GetOrangeTvDataRoot(" ", @"C:\Users\TestUser");
        Assert.Equal(Path.Combine(@"C:\Users\TestUser", "OrangeTv"), root);
    }

    [Fact]
    public void GetUserDataDirectory_uses_UserDataDir_when_set()
    {
        var userDataDir = Path.Combine(Path.GetTempPath(), "profiles", "shell");
        var options = new BrowserShellOptions { UserDataDir = $"  {userDataDir}  " };
        var path = BrowserShellPaths.GetUserDataDirectory(options, @"C:\OrangeTv");
        Assert.Equal(Path.GetFullPath(userDataDir), path);
    }

    [Fact]
    public void GetUserDataDirectory_under_orange_root_when_UserDataDir_null()
    {
        var options = new BrowserShellOptions();
        var path = BrowserShellPaths.GetUserDataDirectory(options, @"C:\OrangeTv");
        Assert.Equal(Path.Combine(@"C:\OrangeTv", "browser-shell", "profile"), path);
    }

    [Fact]
    public void GetLaunchStatePath_is_under_browser_shell()
    {
        var path = BrowserShellPaths.GetLaunchStatePath(@"C:\OrangeTv");
        Assert.Equal(Path.Combine(@"C:\OrangeTv", "browser-shell", "launch-state.json"), path);
    }

    [Fact]
    public void ResolveOrangeTvDataRoot_returns_existing_directory()
    {
        var root = BrowserShellPaths.ResolveOrangeTvDataRoot();
        Assert.False(string.IsNullOrWhiteSpace(root));
        Assert.EndsWith("OrangeTv", root, StringComparison.OrdinalIgnoreCase);
    }
}
