namespace OrangeTv.Api.Library;

public interface IMediaMetadataExtractor
{
    /// <summary>
    /// Reads duration, dimensions, and optional title. Does not throw; returns partial results on failure.
    /// </summary>
    Task<MediaMetadataResult> ExtractAsync(string filePath, CancellationToken cancellationToken);
}
