using OrangeTv.Api.Recommendations;
using Xunit;

namespace OrangeTv.Api.Tests.Recommendations;

public sealed class MediaGenreExtractorTests
{
    [Fact]
    public void TryExtractGenre_reads_ffprobe_format_tags_genre()
    {
        var json = """{"format":{"tags":{"genre":"Documentary"}}}""";
        Assert.Equal("Documentary", MediaGenreExtractor.TryExtractGenre(json));
    }

    [Fact]
    public void TryExtractGenre_reads_flat_tags_genre()
    {
        var json = """{"tags":{"genre":"Rock"}}""";
        Assert.Equal("Rock", MediaGenreExtractor.TryExtractGenre(json));
    }

    [Fact]
    public void TryExtractGenre_reads_first_stream_tags_genre()
    {
        var json = """{"streams":[{"tags":{"genre":"Jazz"}}]}""";
        Assert.Equal("Jazz", MediaGenreExtractor.TryExtractGenre(json));
    }

    [Fact]
    public void TryExtractGenre_returns_null_for_invalid_json()
    {
        Assert.Null(MediaGenreExtractor.TryExtractGenre("{"));
    }
}
