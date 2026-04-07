namespace OrangeTv.Api.Shell;

/// <summary>
/// Parses <see cref="BrowserShellOptions.LauncherUrl"/> for auto-launch.
/// </summary>
public static class BrowserShellLauncherUri
{
    public static bool TryCreateAbsolute(string launcherUrl, out Uri? uri)
    {
        return Uri.TryCreate(launcherUrl, UriKind.Absolute, out uri);
    }
}
