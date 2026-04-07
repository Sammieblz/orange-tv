namespace OrangeTv.Api.Shell;

/// <summary>
/// Chromium command-line arguments for the Orange TV shell (deterministic; unit-tested).
/// </summary>
public static class BrowserShellChromeArguments
{
    public static IEnumerable<string> BuildArguments(
        Uri launcherUri,
        BrowserShellOptions options,
        string userDataDirectory)
    {
        yield return "--no-first-run";
        yield return "--no-default-browser-check";
        yield return "--disable-session-crashed-bubble";
        yield return $"--user-data-dir={userDataDirectory}";

        if (options.StartFullscreen)
        {
            yield return "--start-fullscreen";
        }

        if (options.UseAppMode)
        {
            yield return $"--app={launcherUri}";
            yield break;
        }

        yield return "--new-window";
        yield return launcherUri.ToString();
    }
}
