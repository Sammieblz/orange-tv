using OrangeTv.Api.Data.Entities;
using OrangeTv.Api.Launch;
using Xunit;

namespace OrangeTv.Api.Tests.Launch;

public sealed class SessionFreshnessHeuristicsTests
{
    [Theory]
    [InlineData(1)]
    [InlineData(-1)]
    public void FromExit_non_zero_is_reset_suggested(int exitCode)
    {
        var f = SessionFreshnessHeuristics.FromExit(exitCode, TimeSpan.FromMinutes(1));
        Assert.Equal(SessionFreshness.ResetSuggested, f);
    }

    [Fact]
    public void FromExit_zero_but_short_session_is_possibly_stale()
    {
        var f = SessionFreshnessHeuristics.FromExit(0, TimeSpan.FromMilliseconds(100));
        Assert.Equal(SessionFreshness.PossiblyStale, f);
    }

    [Fact]
    public void FromExit_zero_and_long_session_is_likely_active()
    {
        var f = SessionFreshnessHeuristics.FromExit(0, TimeSpan.FromSeconds(10));
        Assert.Equal(SessionFreshness.LikelyActive, f);
    }
}
