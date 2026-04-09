using OrangeTv.Api.Library;
using Xunit;

namespace OrangeTv.Api.Tests.Library;

public sealed class MediaScanSkipRulesTests
{
    [Fact]
    public void IsUnchanged_true_when_size_and_mtime_match()
    {
        var t = new DateTime(2025, 1, 2, 3, 4, 5, DateTimeKind.Utc);
        Assert.True(MediaScanSkipRules.IsUnchanged(100, t, 100, t));
    }

    [Fact]
    public void IsUnchanged_false_when_size_differs()
    {
        var t = new DateTime(2025, 1, 2, 3, 4, 5, DateTimeKind.Utc);
        Assert.False(MediaScanSkipRules.IsUnchanged(100, t, 101, t));
    }

    [Fact]
    public void IsUnchanged_false_when_mtime_differs()
    {
        var t1 = new DateTime(2025, 1, 2, 3, 4, 5, DateTimeKind.Utc);
        var t2 = new DateTime(2025, 1, 3, 3, 4, 5, DateTimeKind.Utc);
        Assert.False(MediaScanSkipRules.IsUnchanged(100, t1, 100, t2));
    }
}
