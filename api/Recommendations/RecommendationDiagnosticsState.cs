namespace OrangeTv.Api.Recommendations;

/// <summary>Last computed home recommendation feed for diagnostics (dev / support).</summary>
public sealed class RecommendationDiagnosticsState
{
    private readonly object _gate = new();

    public HomeRecommendationsResponse? LastHomeFeed { get; private set; }

    public DateTime? LastComputedUtc { get; private set; }

    public string? LastCacheKey { get; private set; }

    public void SetLast(HomeRecommendationsResponse feed, string cacheKey)
    {
        lock (_gate)
        {
            LastHomeFeed = feed;
            LastCacheKey = cacheKey;
            LastComputedUtc = DateTime.UtcNow;
        }
    }

    public (DateTime? AtUtc, string? CacheKey, HomeRecommendationsResponse? Feed) GetSnapshot()
    {
        lock (_gate)
        {
            return (LastComputedUtc, LastCacheKey, LastHomeFeed);
        }
    }
}
