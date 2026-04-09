# Rules-based recommendations (pre-ML)

This document describes **deterministic** home-feed rows. There is **no** model training job. Future ML re-ranking is gated behind [`IMlRecommendationRanker`](../api/Recommendations/IMlRecommendationRanker.cs) (currently [`NoOpMlRecommendationRanker`](../api/Recommendations/NoOpMlRecommendationRanker.cs)).

## API

| Endpoint | Purpose |
|----------|---------|
| `GET /api/v1/recommendations/home` | Rules feed: recent media, top apps, genre/time picks. |
| `GET /api/v1/diagnostics/recommendations` | **Development only** — last computed feed and cache key. |

Query parameters:

| Parameter | Default | Description |
|-----------|---------|-------------|
| `recentTake` | 12 | Max items in **Recent** row (`0` omits building that row). |
| `topAppsTake` | 8 | Max items in **Top apps** row. |
| `genreTake` | 8 | Max items in **Picks for you** row. |
| `localHour` | — | Client local hour `0–23` for time-of-day genre heuristics; if omitted, **Picks** returns empty items. |

Response metadata:

- `engine`: always `"rules"` for this implementation.
- `mlRanker`: `"none"` until an ML ranker is registered.
- `rankingRulesVersion`: `rec-home-v1` — bump when ordering/filter rules change.
- `continueRankingRulesVersion`: documents alignment with [`GET /api/v1/watch/continue`](watch-history.md) (`cw-v1`).

## Row rules

### Recent (`rowId`: `recent`)

- **Source**: [`watch_events`](watch-history.md) with `MediaItemId` set and `EventType` ∈ { `PlaybackStarted`, `PlaybackEnded`, `PlaybackProgress` }.
- **Score**: last activity time per media: `MAX(OccurredAtUtc)`.
- **Order**: `lastActivity DESC`, tie-break `MediaItemId ASC`.

### Top apps (`rowId`: `top-apps`)

- **Source**: `watch_events` with `AppId` set, excluding synthetic [`local-media`](../api/Launch/LocalMediaAppConstants.cs), `EventType` ∈ { `AppLaunched`, `PlaybackStarted` }.
- **Window**: last `TopAppsLookbackDays` days (default **30**, `ORANGETV_API__Recommendations__TopAppsLookbackDays`).
- **Order**: event count `DESC`, tie-break `AppId ASC`.
- **Join**: [`apps`](../api/Data/Entities/AppEntity.cs) for labels.

### Picks for you (`rowId`: `picks`)

- **Genre**: parsed from `media_items.MetadataJson` via [`MediaGenreExtractor`](../api/Recommendations/MediaGenreExtractor.cs) (ffprobe-style `format.tags.genre`, flat `tags.genre`, or `streams[].tags.genre`).
- **Time-of-day**: [`TimeOfDayGenreRules`](../api/Recommendations/TimeOfDayGenreRules.cs) maps `localHour` to a bucket (Late / Morning / Afternoon / Evening) and preferred genre **substrings** (case-insensitive).
- **Scan**: newest `LastScannedAtUtc` first, up to `GenreCandidateScanLimit` rows (default **500**).
- **Order** among matches: `LastScannedAtUtc DESC`, `MediaItemId ASC`.

## Caching

In-memory cache for `GET /api/v1/recommendations/home` with TTL `ORANGETV_API__Recommendations__CacheTtlSeconds` (default **60**). Set to `0` to disable.

## ML extension (future)

1. Implement `IMlRecommendationRanker` to reorder **candidate lists** produced here (same inputs, shadow or replacement ranking).
2. Training pipelines, feature stores, and batch jobs stay **out of band** from this rules service.
