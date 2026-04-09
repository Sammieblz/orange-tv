namespace OrangeTv.Api.Configuration;

/// <summary>
/// Binds <c>ORANGETV_API</c> from configuration (see <c>ORANGETV_API__Data__SqlitePath</c> in environment).
/// </summary>
public sealed class OrangetvApiOptions
{
    public const string SectionName = "ORANGETV_API";

    public DataOptions Data { get; set; } = new();

    public LaunchOptions Launch { get; set; } = new();
}

public sealed class LaunchOptions
{
    /// <summary>
    /// Optional media file path for seeded MPV demos when the app row has no <c>LaunchUrl</c>.
    /// Set via <c>ORANGETV_API__Launch__SampleMediaPath</c>.
    /// </summary>
    public string? SampleMediaPath { get; set; }

    /// <summary>
    /// Default parent directory for Chrome <c>--user-data-dir</c> segment folders when
    /// <c>launcher.chrome.profilesRoot</c> is unset. Set via <c>ORANGETV_API__Launch__ChromeProfilesRoot</c>.
    /// </summary>
    public string? ChromeProfilesRoot { get; set; }
}

public sealed class DataOptions
{
    /// <summary>
    /// Full path to the SQLite database file. Empty or missing: default under local application data.
    /// </summary>
    public string? SqlitePath { get; set; }
}
