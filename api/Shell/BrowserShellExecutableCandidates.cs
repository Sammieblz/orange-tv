using OrangeTv.Api.Platform;

namespace OrangeTv.Api.Shell;

/// <summary>
/// Executable search order for Chromium/Chrome (testable without launching processes).
/// </summary>
public static class BrowserShellExecutableCandidates
{
    public static IEnumerable<string> Enumerate(BrowserShellOptions options, IPlatformEnvironment platform)
    {
        if (!string.IsNullOrWhiteSpace(options.ExecutablePath))
        {
            yield return options.ExecutablePath.Trim();
        }

        if (platform.IsLinux)
        {
            foreach (var p in EnumerateLinux())
            {
                yield return p;
            }

            yield break;
        }

        if (platform.IsWindows)
        {
            foreach (var p in EnumerateWindowsChromePaths(
                         Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles),
                         Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86),
                         Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData)))
            {
                yield return p;
            }

            yield break;
        }

        foreach (var p in EnumerateGenericUnix())
        {
            yield return p;
        }
    }

    /// <summary>
    /// Windows Chrome paths using explicit special-folder roots (for unit tests).
    /// </summary>
    public static IEnumerable<string> EnumerateWindowsChromePaths(
        string? programFiles,
        string? programFilesX86,
        string? localAppData)
    {
        yield return "chrome.exe";

        if (!string.IsNullOrWhiteSpace(programFiles))
        {
            yield return CombineWindowsChromePath(programFiles);
        }

        if (!string.IsNullOrWhiteSpace(programFilesX86))
        {
            yield return CombineWindowsChromePath(programFilesX86);
        }

        if (!string.IsNullOrWhiteSpace(localAppData))
        {
            yield return CombineWindowsChromePath(localAppData);
        }
    }

    private static string CombineWindowsChromePath(string root)
    {
        return string.Join(
            '\\',
            root.TrimEnd('\\', '/'),
            "Google",
            "Chrome",
            "Application",
            "chrome.exe");
    }

    internal static IEnumerable<string> EnumerateLinux()
    {
        yield return "chromium-browser";
        yield return "chromium";
        yield return "google-chrome";
        yield return "google-chrome-stable";
    }

    internal static IEnumerable<string> EnumerateGenericUnix()
    {
        yield return "chromium-browser";
        yield return "chromium";
        yield return "google-chrome";
    }
}
