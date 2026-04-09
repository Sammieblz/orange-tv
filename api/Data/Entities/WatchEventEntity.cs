namespace OrangeTv.Api.Data.Entities;

/// <summary>Append-only playback / launch events (source of truth for auditing).</summary>
public sealed class WatchEventEntity
{
    public Guid Id { get; set; }

    public DateTime OccurredAtUtc { get; set; }

    public WatchEventType EventType { get; set; }

    public Guid? LaunchSessionId { get; set; }

    public string? AppId { get; set; }

    public Guid? MediaItemId { get; set; }

    public double? PositionSeconds { get; set; }

    public double? DurationSeconds { get; set; }

    public string? PayloadJson { get; set; }
}
