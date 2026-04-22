using OrangeTv.Api.Platform;

namespace OrangeTv.Api.Launch;

/// <summary>
/// Resolves Chrome <c>--user-data-dir</c> under a configurable parent (settings, config, or default under OrangeTv data root).
/// </summary>
public static class ChromeProfilePaths
{
    public const string ProfilesRootSettingKey = "launcher.chrome.profilesRoot";

    /// <summary>Minimum session length to treat a zero exit as a healthy run.</summary>
    public static readonly TimeSpan ShortSessionThreshold = TimeSpan.FromSeconds(3);

    /// <summary>
    /// Parent directory containing one folder per profile segment (or shared segment).
    /// </summary>
    public static string ResolveProfilesParent(
        string orangeTvDataRoot,
        string? settingsProfilesRoot,
        string? configProfilesRoot,
        IPlatformEnvironment platform)
    {
        var fromSettings = settingsProfilesRoot?.Trim();
        if (!string.IsNullOrEmpty(fromSettings))
        {
            if (!Path.IsPathRooted(fromSettings))
            {
                return platform.NormalizePath(
                    Path.GetFullPath(Path.Combine(orangeTvDataRoot, fromSettings)));
            }

            return platform.NormalizePath(Path.GetFullPath(fromSettings));
        }

        var fromConfig = configProfilesRoot?.Trim();
        if (!string.IsNullOrEmpty(fromConfig))
        {
            if (!Path.IsPathRooted(fromConfig))
            {
                return platform.NormalizePath(
                    Path.GetFullPath(Path.Combine(orangeTvDataRoot, fromConfig)));
            }

            return platform.NormalizePath(Path.GetFullPath(fromConfig));
        }

        return platform.NormalizePath(Path.Combine(orangeTvDataRoot, "launch-chrome"));
    }

    /// <summary>
    /// Single segment folder name under <paramref name="profilesParent"/>; never accepts full paths from DB.
    /// </summary>
    public static string ResolveSegmentFolderName(string appId, string? chromeProfileSegment)
    {
        var raw = string.IsNullOrWhiteSpace(chromeProfileSegment)
            ? appId
            : chromeProfileSegment.Trim();
        return SanitizeSegment(raw);
    }

    public static string SanitizeSegment(string value)
    {
        var invalid = Path.GetInvalidFileNameChars()
            .Concat(new[] { '<', '>', ':', '"', '/', '\\', '|', '?', '*' })
            .ToHashSet();
        var chars = value.Select(c => invalid.Contains(c) ? '_' : c).ToArray();
        var s = new string(chars).Trim();
        if (string.IsNullOrEmpty(s))
        {
            return "app";
        }

        return s.Length > 128 ? s[..128] : s;
    }

    public static string ResolveUserDataDir(
        string orangeTvDataRoot,
        string? settingsProfilesRoot,
        string? configProfilesRoot,
        string appId,
        string? chromeProfileSegment,
        IPlatformEnvironment platform)
    {
        var parent = ResolveProfilesParent(orangeTvDataRoot, settingsProfilesRoot, configProfilesRoot, platform);
        var segment = ResolveSegmentFolderName(appId, chromeProfileSegment);
        return platform.NormalizePath(Path.Combine(parent, segment));
    }
}
