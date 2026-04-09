namespace OrangeTv.Api.Library;

public static class MediaLibraryPaths
{
    public static string GetMediaCacheRoot(string orangeTvDataRoot) =>
        Path.Combine(orangeTvDataRoot, "media-cache");

    public static string GetThumbnailsDirectory(string orangeTvDataRoot) =>
        Path.Combine(GetMediaCacheRoot(orangeTvDataRoot), "thumbnails");
}
