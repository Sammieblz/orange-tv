using OrangeTv.Api.Library;
using Xunit;

namespace OrangeTv.Api.Tests.Library;

public sealed class MediaLibraryPathsTests
{
    [Fact]
    public void GetThumbnailsDirectory_is_under_media_cache()
    {
        var root = Path.Combine(Path.GetTempPath(), "OrangeTvTest", Guid.NewGuid().ToString("N"));
        var thumbs = MediaLibraryPaths.GetThumbnailsDirectory(root);
        Assert.Equal(Path.Combine(root, "media-cache", "thumbnails"), thumbs);
    }
}
