namespace OrangeTv.Api.Shell;

/// <summary>
/// Chromium flags for catalog streaming launches (Netflix, etc.). Uses <c>--app=</c> so the window
/// behaves like a hosted app (minimal browser chrome, no tab strip), closer to Apple TV / Roku than
/// <c>--new-window</c> + URL which opens a full browser frame.
/// </summary>
public static class ChromeStreamingLaunchArguments
{
    /// <param name="launchUrl">Absolute https URL or <c>about:blank</c>.</param>
    /// <param name="userDataDirectory">Per-app Chrome profile directory.</param>
    /// <param name="useAppWindow">When true, emits <c>--app=</c>. When false, legacy <c>--new-window</c> + URL (full browser UI).</param>
    /// <param name="startFullscreen">When true, adds <c>--start-fullscreen</c> for TV-style takeover.</param>
    public static IEnumerable<string> Build(
        string launchUrl,
        string userDataDirectory,
        bool useAppWindow,
        bool startFullscreen)
    {
        yield return "--no-first-run";
        yield return "--no-default-browser-check";
        yield return "--disable-session-crashed-bubble";
        yield return "--disable-infobars";
        yield return $"--user-data-dir={userDataDirectory}";

        if (startFullscreen)
        {
            yield return "--start-fullscreen";
        }

        if (useAppWindow)
        {
            yield return $"--app={launchUrl}";
            yield break;
        }

        yield return "--new-window";
        yield return launchUrl;
    }
}
