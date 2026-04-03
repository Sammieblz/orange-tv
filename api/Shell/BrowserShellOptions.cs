namespace OrangeTv.Api.Shell;

public sealed class BrowserShellOptions
{
    public const string SectionName = "BrowserShell";

    public bool Enabled { get; set; }

    public string LauncherUrl { get; set; } = "http://localhost:5173";

    public string? ExecutablePath { get; set; }

    public string? UserDataDir { get; set; }

    public bool UseAppMode { get; set; } = true;

    public bool StartFullscreen { get; set; }

    public int ReadyTimeoutSeconds { get; set; } = 60;

    public int ReadyPollIntervalMilliseconds { get; set; } = 1000;
}
