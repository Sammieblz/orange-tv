using OrangeTv.Api.Data;
using OrangeTv.Api.Data.Entities;

namespace OrangeTv.Api.Services;

/// <summary>Updates <see cref="MediaResumeEntity"/> from append-only watch events.</summary>
public sealed class WatchAggregationService
{
    /// <summary>
    /// Applies resume upsert rules after a <see cref="WatchEventEntity"/> row is added (before <c>SaveChanges</c>).
    /// </summary>
    public void ApplyAfterWatchEvent(OrangeTvDbContext db, WatchEventEntity e, DateTime nowUtc)
    {
        if (e.MediaItemId is null || e.MediaItemId == Guid.Empty)
        {
            return;
        }

        switch (e.EventType)
        {
            case WatchEventType.PlaybackProgress:
                TryUpsertResume(db, e, nowUtc);
                break;
            case WatchEventType.PlaybackEnded:
                TryUpsertResume(db, e, nowUtc);
                break;
            default:
                break;
        }
    }

    private static void TryUpsertResume(OrangeTvDbContext db, WatchEventEntity e, DateTime nowUtc)
    {
        var position = e.PositionSeconds;
        var duration = e.DurationSeconds;
        if (position is null || duration is null || duration <= 0)
        {
            return;
        }

        var pos = position.Value;
        var dur = duration.Value;
        if (pos < 0 || pos > dur * 1.01)
        {
            return;
        }

        var mid = e.MediaItemId!.Value;
        var existing = db.MediaResumes.Find(mid);
        if (existing is null)
        {
            db.MediaResumes.Add(
                new MediaResumeEntity
                {
                    MediaItemId = mid,
                    PositionSeconds = pos,
                    DurationSeconds = dur,
                    LastPlayedAtUtc = nowUtc,
                    UpdatedAtUtc = nowUtc,
                    LastEventId = e.Id,
                    LastLaunchSessionId = e.LaunchSessionId,
                });
        }
        else
        {
            existing.PositionSeconds = pos;
            existing.DurationSeconds = dur;
            existing.LastPlayedAtUtc = nowUtc;
            existing.UpdatedAtUtc = nowUtc;
            existing.LastEventId = e.Id;
            existing.LastLaunchSessionId = e.LaunchSessionId ?? existing.LastLaunchSessionId;
        }
    }
}
