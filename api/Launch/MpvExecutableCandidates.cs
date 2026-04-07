using OrangeTv.Api.Platform;

namespace OrangeTv.Api.Launch;

/// <summary>
/// Search order for MPV binary (testable enumeration).
/// </summary>
public static class MpvExecutableCandidates
{
    public static IEnumerable<string> Enumerate(IPlatformEnvironment platform)
    {
        if (platform.IsWindows)
        {
            yield return "mpv.exe";
            var programFiles = Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles);
            if (!string.IsNullOrWhiteSpace(programFiles))
            {
                yield return Path.Combine(programFiles, "mpv", "mpv.exe");
            }

            yield break;
        }

        yield return "mpv";
        yield return "/usr/bin/mpv";
        yield return "/usr/local/bin/mpv";
    }
}
