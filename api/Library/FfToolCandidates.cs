using OrangeTv.Api.Platform;

namespace OrangeTv.Api.Library;

/// <summary>
/// Candidate paths for ffprobe / ffmpeg (PATH + common install locations).
/// </summary>
public static class FfToolCandidates
{
    public static IEnumerable<string> EnumerateFfprobe(IPlatformEnvironment platform)
    {
        foreach (var p in EnumerateWindows("ffprobe.exe", platform))
        {
            yield return p;
        }

        if (!platform.IsWindows)
        {
            yield return "ffprobe";
            yield return "/usr/bin/ffprobe";
            yield return "/usr/local/bin/ffprobe";
        }
    }

    public static IEnumerable<string> EnumerateFfmpeg(IPlatformEnvironment platform)
    {
        foreach (var p in EnumerateWindows("ffmpeg.exe", platform))
        {
            yield return p;
        }

        if (!platform.IsWindows)
        {
            yield return "ffmpeg";
            yield return "/usr/bin/ffmpeg";
            yield return "/usr/local/bin/ffmpeg";
        }
    }

    private static IEnumerable<string> EnumerateWindows(string fileName, IPlatformEnvironment platform)
    {
        if (!platform.IsWindows)
        {
            yield break;
        }

        yield return fileName;
    }
}
