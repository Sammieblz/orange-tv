namespace OrangeTv.Api.Shell;

/// <summary>
/// Path composition for browser profile, launch state, and app data root (testable with injected roots).
/// </summary>
public static class BrowserShellPaths
{
    /// <summary>
    /// Resolves the OrangeTv data directory under LocalApplicationData (or UserProfile fallback).
    /// </summary>
    public static string ResolveOrangeTvDataRoot()
    {
        var localAppData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
        var userProfile = Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);
        return GetOrangeTvDataRoot(localAppData, userProfile);
    }

    /// <summary>
    /// Builds the OrangeTv data root from known folder paths (used by tests with fake roots).
    /// </summary>
    public static string GetOrangeTvDataRoot(string? localAppData, string? userProfileFallback)
    {
        var root = localAppData;
        if (string.IsNullOrWhiteSpace(root))
        {
            root = userProfileFallback ?? string.Empty;
        }

        return Path.Combine(root, "OrangeTv");
    }

    public static string GetUserDataDirectory(BrowserShellOptions options, string orangeTvDataRoot)
    {
        if (!string.IsNullOrWhiteSpace(options.UserDataDir))
        {
            return Path.GetFullPath(options.UserDataDir.Trim());
        }

        return Path.Combine(orangeTvDataRoot, "browser-shell", "profile");
    }

    public static string GetLaunchStatePath(string orangeTvDataRoot)
    {
        return Path.Combine(orangeTvDataRoot, "browser-shell", "launch-state.json");
    }
}
