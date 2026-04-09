using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using OrangeTv.Api.Configuration;
using OrangeTv.Api.Data;
using OrangeTv.Api.Recommendations;

namespace OrangeTv.Api.Endpoints;

public static class RecommendationEndpoints
{
    public static void MapRecommendationEndpoints(this WebApplication app)
    {
        app.MapGet(
                "/api/v1/recommendations/home",
                async (
                    OrangeTvDbContext db,
                    [FromServices] IMemoryCache cache,
                    [FromServices] RulesRecommendationService rules,
                    [FromServices] RecommendationDiagnosticsState diagnostics,
                    [FromServices] IOptions<OrangetvApiOptions> options,
                    [FromServices] ILoggerFactory loggerFactory,
                    int? recentTake,
                    int? topAppsTake,
                    int? genreTake,
                    int? localHour,
                    CancellationToken cancellationToken) =>
                {
                    var log = loggerFactory.CreateLogger("OrangeTv.Api.Recommendations.Home");
                    var ttl = Math.Clamp(options.Value.Recommendations.CacheTtlSeconds, 0, 600);
                    var r = recentTake ?? 12;
                    var t = topAppsTake ?? 8;
                    var g = genreTake ?? 8;
                    var hour = localHour is >= 0 and <= 23 ? localHour : null;

                    var cacheKey =
                        $"rec-home:v1:r{r}:t{t}:g{g}:h{(hour?.ToString() ?? "null")}";

                    if (ttl > 0 && cache.TryGetValue<HomeRecommendationsResponse>(cacheKey, out var cached) &&
                        cached is not null)
                    {
                        log.LogDebug("Recommendation cache hit {CacheKey}", cacheKey);
                        return Results.Ok(cached);
                    }

                    log.LogDebug("Recommendation cache miss {CacheKey}", cacheKey);

                    var result = await rules
                        .BuildHomeFeedAsync(db, r, t, g, hour, cancellationToken)
                        .ConfigureAwait(false);

                    diagnostics.SetLast(result, cacheKey);

                    if (ttl > 0)
                    {
                        cache.Set(
                            cacheKey,
                            result,
                            new MemoryCacheEntryOptions { AbsoluteExpirationRelativeToNow = TimeSpan.FromSeconds(ttl) });
                    }

                    return Results.Ok(result);
                })
            .WithName("GetRecommendationsHome")
            .WithTags("recommendations");

        app.MapGet(
                "/api/v1/diagnostics/recommendations",
                (
                    IWebHostEnvironment env,
                    RecommendationDiagnosticsState diagnostics) =>
                {
                    if (!env.IsDevelopment())
                    {
                        return Results.NotFound();
                    }

                    var (at, key, feed) = diagnostics.GetSnapshot();
                    return Results.Ok(
                        new
                        {
                            lastComputedUtc = at,
                            lastCacheKey = key,
                            lastFeed = feed,
                        });
                })
            .WithName("GetRecommendationsDiagnostics")
            .WithTags("diagnostics");
    }
}
