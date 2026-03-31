namespace OrangeTv.Api.Platform;

/// <summary>
/// OS-aware surface for paths and runtime so Linux-specific behavior can stay behind injectable services.
/// </summary>
public interface IPlatformEnvironment
{
    bool IsWindows { get; }

    bool IsLinux { get; }

    /// <summary>
    /// Preferred separator for normalized paths stored in config or logs (forward slash where possible).
    /// </summary>
    char PreferredDirectorySeparator { get; }

    /// <summary>
    /// Normalizes a path for cross-platform comparisons and persistence (does not verify existence).
    /// </summary>
    string NormalizePath(string path);
}
