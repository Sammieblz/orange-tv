using OrangeTv.Api.Platform;

namespace OrangeTv.Api.Tests.Support;

/// <summary>
/// Configurable <see cref="IPlatformEnvironment"/> for shell candidate tests.
/// </summary>
public sealed class FakePlatformEnvironment : IPlatformEnvironment
{
    public bool IsWindows { get; init; }

    public bool IsLinux { get; init; }

    public char PreferredDirectorySeparator => '/';

    public string NormalizePath(string path) => path;
}
