using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using OrangeTv.Api.Data;
using OrangeTv.Api.Data.Entities;
using OrangeTv.Api.Services;
using Xunit;

namespace OrangeTv.Api.Tests.Services;

public sealed class WatchAggregationServiceTests
{
    private static async Task<(SqliteConnection Conn, OrangeTvDbContext Db, Guid MediaId)> OpenDbWithMediaAsync()
    {
        var connection = new SqliteConnection("DataSource=:memory:");
        await connection.OpenAsync();
        var options = new DbContextOptionsBuilder<OrangeTvDbContext>()
            .UseSqlite(connection)
            .Options;

        var db = new OrangeTvDbContext(options);
        await db.Database.MigrateAsync();

        var mediaId = Guid.NewGuid();
        var now = DateTime.UtcNow;
        db.MediaItems.Add(
            new MediaItemEntity
            {
                Id = mediaId,
                FilePath = Path.Combine(Path.GetTempPath(), $"agg-test-{mediaId:N}.mp4"),
                FileSizeBytes = 1,
                FileModifiedAtUtc = now,
                LastScannedAtUtc = now,
                CreatedAtUtc = now,
                UpdatedAtUtc = now,
                DurationSeconds = 100,
            });
        await db.SaveChangesAsync();
        return (connection, db, mediaId);
    }

    [Fact]
    public async Task ApplyAfterWatchEvent_PlaybackProgress_inserts_media_resume()
    {
        var (conn, db, mediaId) = await OpenDbWithMediaAsync();
        await using (conn)
        await using (db)
        {
            var agg = new WatchAggregationService();
            var evtId = Guid.NewGuid();
            var now = DateTime.UtcNow;
            var e = new WatchEventEntity
            {
                Id = evtId,
                OccurredAtUtc = now,
                EventType = WatchEventType.PlaybackProgress,
                MediaItemId = mediaId,
                PositionSeconds = 25,
                DurationSeconds = 100,
            };

            agg.ApplyAfterWatchEvent(db, e, now);
            await db.SaveChangesAsync();

            var row = await db.MediaResumes.AsNoTracking().SingleAsync(r => r.MediaItemId == mediaId);
            Assert.Equal(25, row.PositionSeconds, precision: 5);
            Assert.Equal(100, row.DurationSeconds, precision: 5);
            Assert.Equal(evtId, row.LastEventId);
        }
    }

    [Fact]
    public async Task ApplyAfterWatchEvent_second_progress_updates_existing_row()
    {
        var (conn, db, mediaId) = await OpenDbWithMediaAsync();
        await using (conn)
        await using (db)
        {
            var agg = new WatchAggregationService();
            var now = DateTime.UtcNow;
            var first = new WatchEventEntity
            {
                Id = Guid.NewGuid(),
                OccurredAtUtc = now,
                EventType = WatchEventType.PlaybackProgress,
                MediaItemId = mediaId,
                PositionSeconds = 10,
                DurationSeconds = 100,
            };
            agg.ApplyAfterWatchEvent(db, first, now);
            await db.SaveChangesAsync();

            var second = new WatchEventEntity
            {
                Id = Guid.NewGuid(),
                OccurredAtUtc = now.AddMinutes(1),
                EventType = WatchEventType.PlaybackProgress,
                MediaItemId = mediaId,
                PositionSeconds = 50,
                DurationSeconds = 100,
            };
            agg.ApplyAfterWatchEvent(db, second, now.AddMinutes(1));
            await db.SaveChangesAsync();

            var row = await db.MediaResumes.AsNoTracking().SingleAsync(r => r.MediaItemId == mediaId);
            Assert.Equal(50, row.PositionSeconds, precision: 5);
            Assert.Equal(second.Id, row.LastEventId);
        }
    }

    [Fact]
    public async Task ApplyAfterWatchEvent_AppLaunched_does_not_create_resume()
    {
        var (conn, db, mediaId) = await OpenDbWithMediaAsync();
        await using (conn)
        await using (db)
        {
            var agg = new WatchAggregationService();
            var e = new WatchEventEntity
            {
                Id = Guid.NewGuid(),
                OccurredAtUtc = DateTime.UtcNow,
                EventType = WatchEventType.AppLaunched,
                MediaItemId = mediaId,
                PositionSeconds = 1,
                DurationSeconds = 100,
            };

            agg.ApplyAfterWatchEvent(db, e, DateTime.UtcNow);
            await db.SaveChangesAsync();

            Assert.Equal(0, await db.MediaResumes.CountAsync());
        }
    }

    [Fact]
    public async Task ApplyAfterWatchEvent_ignores_position_above_duration_slack()
    {
        var (conn, db, mediaId) = await OpenDbWithMediaAsync();
        await using (conn)
        await using (db)
        {
            var agg = new WatchAggregationService();
            var e = new WatchEventEntity
            {
                Id = Guid.NewGuid(),
                OccurredAtUtc = DateTime.UtcNow,
                EventType = WatchEventType.PlaybackProgress,
                MediaItemId = mediaId,
                PositionSeconds = 102,
                DurationSeconds = 100,
            };

            agg.ApplyAfterWatchEvent(db, e, DateTime.UtcNow);
            await db.SaveChangesAsync();

            Assert.Equal(0, await db.MediaResumes.CountAsync());
        }
    }

    [Fact]
    public async Task ApplyAfterWatchEvent_ignores_null_media_item_id()
    {
        var (conn, db, _) = await OpenDbWithMediaAsync();
        await using (conn)
        await using (db)
        {
            var agg = new WatchAggregationService();
            var e = new WatchEventEntity
            {
                Id = Guid.NewGuid(),
                OccurredAtUtc = DateTime.UtcNow,
                EventType = WatchEventType.PlaybackProgress,
                MediaItemId = null,
                PositionSeconds = 10,
                DurationSeconds = 100,
            };

            agg.ApplyAfterWatchEvent(db, e, DateTime.UtcNow);
            await db.SaveChangesAsync();

            Assert.Equal(0, await db.MediaResumes.CountAsync());
        }
    }
}
