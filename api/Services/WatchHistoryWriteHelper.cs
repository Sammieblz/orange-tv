using OrangeTv.Api.Data;
using OrangeTv.Api.Data.Entities;

namespace OrangeTv.Api.Services;

/// <summary>Shared helpers for writing watch events and applying aggregation in one unit of work.</summary>
public sealed class WatchHistoryWriteHelper
{
    private readonly WatchAggregationService _aggregation;

    public WatchHistoryWriteHelper(WatchAggregationService aggregation)
    {
        _aggregation = aggregation;
    }

    public void AddEvent(OrangeTvDbContext db, WatchEventEntity entity, DateTime nowUtc)
    {
        db.WatchEvents.Add(entity);
        _aggregation.ApplyAfterWatchEvent(db, entity, nowUtc);
    }
}
