namespace OrangeTv.Api.Data.Entities;

/// <summary>Materialized resume row per indexed local media item (derived from watch events).</summary>
public sealed class MediaResumeEntity
{
    public Guid MediaItemId { get; set; }

    public double PositionSeconds { get; set; }

    public double DurationSeconds { get; set; }

    public DateTime LastPlayedAtUtc { get; set; }

    public DateTime UpdatedAtUtc { get; set; }

    public Guid? LastEventId { get; set; }

    public Guid? LastLaunchSessionId { get; set; }
}
