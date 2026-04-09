namespace OrangeTv.Api.Recommendations;

/// <summary>Placeholder ML ranker — no training, no inference. See <see cref="IMlRecommendationRanker"/>.</summary>
public sealed class NoOpMlRecommendationRanker : IMlRecommendationRanker
{
    public string RankerId => "none";
}
