using System.Runtime.InteropServices;

namespace OrangeTv.Api.Platform;

public sealed class PlatformEnvironment : IPlatformEnvironment
{
    public bool IsWindows => RuntimeInformation.IsOSPlatform(OSPlatform.Windows);

    public bool IsLinux => RuntimeInformation.IsOSPlatform(OSPlatform.Linux);

    public char PreferredDirectorySeparator => '/';

    public string NormalizePath(string path)
    {
        if (string.IsNullOrWhiteSpace(path))
        {
            return path;
        }

        var trimmed = path.Trim();
        var replaced = trimmed.Replace('\\', '/');
        return replaced.TrimEnd('/');
    }
}
