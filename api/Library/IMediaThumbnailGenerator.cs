namespace OrangeTv.Api.Library;

public interface IMediaThumbnailGenerator
{
    /// <summary>
    /// Writes a JPEG next to cache layout; returns false if skipped or failed.
    /// </summary>
    Task<bool> TryGenerateAsync(
        string filePath,
        double? durationSeconds,
        bool hasVideoStream,
        string outputJpegPath,
        CancellationToken cancellationToken);
}
