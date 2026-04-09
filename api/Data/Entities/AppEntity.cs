namespace OrangeTv.Api.Data.Entities;

/// <summary>
/// Launcher tile / catalog row aligned with the v1.2 plan <c>apps</c> table (baseline columns only).
/// </summary>
public sealed class AppEntity
{
    public string Id { get; set; } = "";

    public string Label { get; set; } = "";

    public string? Type { get; set; }

    public string? LaunchUrl { get; set; }

    public int SortOrder { get; set; }

    public DateTime CreatedAtUtc { get; set; }

    public DateTime UpdatedAtUtc { get; set; }

    /// <summary>Optional subdirectory name under the resolved Chrome profiles parent; null uses sanitized <see cref="Id"/>.</summary>
    public string? ChromeProfileSegment { get; set; }

    public SessionFreshness SessionFreshness { get; set; }

    public DateTime? LastSessionEndedAtUtc { get; set; }

    public int? LastSessionExitCode { get; set; }
}
