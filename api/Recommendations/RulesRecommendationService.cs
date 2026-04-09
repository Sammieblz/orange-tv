using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using OrangeTv.Api.Configuration;
using OrangeTv.Api.Data;
using OrangeTv.Api.Data.Entities;
using OrangeTv.Api.Launch;

namespace OrangeTv.Api.Recommendations;

/// <summary>Deterministic recommendation rows from SQLite usage data — no ML.</summary>
public sealed class RulesRecommendationService
{
    public const string HomeRankingRulesVersion = "rec-home-v1";
    public const string ContinueRankingRulesVersion = "cw-v1";

    private readonly IOptions<OrangetvApiOptions> _options;
    private readonly ILogger<RulesRecommendationService> _logger;

    public RulesRecommendationService(
        IOptions<OrangetvApiOptions> options,
        ILogger<RulesRecommendationService> logger)
    {
        _options = options;
        _logger = logger;
    }

    public async Task<HomeRecommendationsResponse> BuildHomeFeedAsync(
        OrangeTvDbContext db,
        int recentTake,
        int topAppsTake,
        int genreTake,
        int? localHour,
        CancellationToken cancellationToken)
    {
        recentTake = Math.Clamp(recentTake, 0, 100);
        topAppsTake = Math.Clamp(topAppsTake, 0, 100);
        genreTake = Math.Clamp(genreTake, 0, 100);

        var rows = new List<RecommendationRowResponse>();
        if (recentTake > 0)
        {
            rows.Add(await BuildRecentRowAsync(db, recentTake, cancellationToken).ConfigureAwait(false));
        }

        if (topAppsTake > 0)
        {
            rows.Add(await BuildTopAppsRowAsync(db, topAppsTake, cancellationToken).ConfigureAwait(false));
        }

        if (genreTake > 0)
        {
            rows.Add(await BuildGenreTimeRowAsync(db, genreTake, localHour, cancellationToken).ConfigureAwait(false));
        }

        _logger.LogInformation(
            "Rules recommendation home feed: version {Version}, rows {RowCount}, recentTake {Recent}, topAppsTake {Top}, genreTake {Genre}, localHour {Hour}",
            HomeRankingRulesVersion,
            rows.Count,
            recentTake,
            topAppsTake,
            genreTake,
            localHour);

        return new HomeRecommendationsResponse(
            Engine: "rules",
            MlRanker: "none",
            RankingRulesVersion: HomeRankingRulesVersion,
            ContinueRankingRulesVersion: ContinueRankingRulesVersion,
            Rows: rows);
    }

    private async Task<RecommendationRowResponse> BuildRecentRowAsync(
        OrangeTvDbContext db,
        int take,
        CancellationToken cancellationToken)
    {
        var lastActivity = db.WatchEvents.AsNoTracking()
            .Where(e =>
                e.MediaItemId != null
                && (e.EventType == WatchEventType.PlaybackStarted
                    || e.EventType == WatchEventType.PlaybackEnded
                    || e.EventType == WatchEventType.PlaybackProgress))
            .GroupBy(e => e.MediaItemId!.Value)
            .Select(g => new { MediaItemId = g.Key, LastAt = g.Max(x => x.OccurredAtUtc) });

        var query =
            from la in lastActivity
            join m in db.MediaItems.AsNoTracking() on la.MediaItemId equals m.Id
            orderby la.LastAt descending, la.MediaItemId
            select new RecommendationItemResponse(
                "media",
                m.Id,
                null,
                m.Title ?? m.FilePath,
                null,
                m.ThumbnailRelativePath,
                null);

        var items = await query.Take(take).ToListAsync(cancellationToken).ConfigureAwait(false);

        _logger.LogInformation(
            "Recommendation row recent: candidates {Count}, final ids {Ids}",
            items.Count,
            TruncateIds(items));

        return new RecommendationRowResponse(
            RowId: "recent",
            Title: "Recent",
            Source: "rules",
            RankingRulesVersion: HomeRankingRulesVersion,
            Items: items);
    }

    private async Task<RecommendationRowResponse> BuildTopAppsRowAsync(
        OrangeTvDbContext db,
        int take,
        CancellationToken cancellationToken)
    {
        var lookbackDays = Math.Max(1, _options.Value.Recommendations.TopAppsLookbackDays);
        var since = DateTime.UtcNow.AddDays(-lookbackDays);

        var counts = db.WatchEvents.AsNoTracking()
            .Where(e =>
                e.AppId != null
                && e.AppId != LocalMediaAppConstants.AppId
                && (e.EventType == WatchEventType.AppLaunched || e.EventType == WatchEventType.PlaybackStarted)
                && e.OccurredAtUtc >= since)
            .GroupBy(e => e.AppId!)
            .Select(g => new { AppId = g.Key, Cnt = g.Count() });

        var query =
            from c in counts
            join a in db.Apps.AsNoTracking() on c.AppId equals a.Id
            orderby c.Cnt descending, c.AppId
            select new RecommendationItemResponse(
                "app",
                null,
                a.Id,
                a.Label,
                a.Label,
                null,
                null);

        var items = await query.Take(take).ToListAsync(cancellationToken).ConfigureAwait(false);

        _logger.LogInformation(
            "Recommendation row top-apps: lookbackDays {Days}, items {Count}, ids {Ids}",
            lookbackDays,
            items.Count,
            string.Join(",", items.Select(i => i.AppId).Take(12)));

        return new RecommendationRowResponse(
            RowId: "top-apps",
            Title: "Top apps",
            Source: "rules",
            RankingRulesVersion: HomeRankingRulesVersion,
            Items: items);
    }

    private async Task<RecommendationRowResponse> BuildGenreTimeRowAsync(
        OrangeTvDbContext db,
        int take,
        int? localHour,
        CancellationToken cancellationToken)
    {
        if (localHour is null)
        {
            _logger.LogInformation("Recommendation row picks: skipped (no localHour query)");
            return new RecommendationRowResponse(
                RowId: "picks",
                Title: "Picks for you",
                Source: "rules",
                RankingRulesVersion: HomeRankingRulesVersion,
                Items: []);
        }

        var bucket = TimeOfDayGenreRules.GetBucket(localHour.Value);
        var limit = Math.Max(50, _options.Value.Recommendations.GenreCandidateScanLimit);

        var candidates = await db.MediaItems.AsNoTracking()
            .Where(m => m.MetadataJson != null && m.MetadataJson != "")
            .OrderByDescending(m => m.LastScannedAtUtc)
            .ThenBy(m => m.Id)
            .Take(limit)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        var matches = new List<MediaItemEntity>();
        foreach (var m in candidates)
        {
            var g = MediaGenreExtractor.TryExtractGenre(m.MetadataJson);
            if (TimeOfDayGenreRules.GenreMatchesBucket(g, bucket))
            {
                matches.Add(m);
            }
        }

        var ordered = matches
            .OrderByDescending(x => x.LastScannedAtUtc)
            .ThenBy(x => x.Id)
            .Take(take)
            .ToList();

        var items = ordered
            .Select(m => new RecommendationItemResponse(
                Kind: "media",
                MediaItemId: m.Id,
                AppId: null,
                Title: m.Title ?? m.FilePath,
                Label: null,
                ThumbnailRelativePath: m.ThumbnailRelativePath,
                Progress: null))
            .ToList();

        _logger.LogInformation(
            "Recommendation row picks: bucket {Bucket}, localHour {Hour}, scanned {Scanned}, matches {Matches}",
            bucket,
            localHour,
            candidates.Count,
            matches.Count);

        return new RecommendationRowResponse(
            RowId: "picks",
            Title: "Picks for you",
            Source: "rules",
            RankingRulesVersion: HomeRankingRulesVersion,
            Items: items);
    }

    private static string TruncateIds(IReadOnlyList<RecommendationItemResponse> items)
    {
        var ids = items
            .Select(i => i.MediaItemId?.ToString() ?? i.AppId ?? "")
            .Where(s => s.Length > 0);
        return string.Join(",", ids.Take(8));
    }
}

public sealed record HomeRecommendationsResponse(
    string Engine,
    string MlRanker,
    string RankingRulesVersion,
    string ContinueRankingRulesVersion,
    IReadOnlyList<RecommendationRowResponse> Rows);

public sealed record RecommendationRowResponse(
    string RowId,
    string Title,
    string Source,
    string RankingRulesVersion,
    IReadOnlyList<RecommendationItemResponse> Items);

public sealed record RecommendationItemResponse(
    string Kind,
    Guid? MediaItemId,
    string? AppId,
    string? Title,
    string? Label,
    string? ThumbnailRelativePath,
    double? Progress);
