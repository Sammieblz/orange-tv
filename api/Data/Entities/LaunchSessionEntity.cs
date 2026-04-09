namespace OrangeTv.Api.Data.Entities;

/// <summary>
/// One row per spawned child process (Chrome, MPV, …) for session diagnostics.
/// </summary>
public sealed class LaunchSessionEntity
{
    public Guid Id { get; set; }

    public string AppId { get; set; } = "";

    public int Pid { get; set; }

    public DateTime StartedAtUtc { get; set; }

    public DateTime? EndedAtUtc { get; set; }

    public int? ExitCode { get; set; }

    /// <summary>When MPV plays an indexed library file, links to <c>media_items</c>.</summary>
    public Guid? MediaItemId { get; set; }

    /// <summary>Populated when <see cref="System.Diagnostics.Process.Start"/> fails before a PID exists.</summary>
    public string? SpawnError { get; set; }
}
