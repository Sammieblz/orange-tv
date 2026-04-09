namespace OrangeTv.Api.Recommendations;

/// <summary>
/// Future seam for ML-based re-ranking of recommendation candidates. Not used in rules-only v1.
/// Register <see cref="NoOpMlRecommendationRanker"/> until a model-backed implementation exists.
/// </summary>
public interface IMlRecommendationRanker
{
    /// <summary>Reserved for shadow ranking or A/B; v1 returns <c>none</c> from the feed.</summary>
    string RankerId { get; }
}
