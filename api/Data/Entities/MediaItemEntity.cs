namespace OrangeTv.Api.Data.Entities;

/// <summary>
/// Indexed local media file discovered by the library scanner.
/// </summary>
public sealed class MediaItemEntity
{
    public Guid Id { get; set; }

    /// <summary>Normalized absolute path (unique).</summary>
    public string FilePath { get; set; } = "";

    public long FileSizeBytes { get; set; }

    public DateTime FileModifiedAtUtc { get; set; }

    public string? Title { get; set; }

    public double? DurationSeconds { get; set; }

    public int? Width { get; set; }

    public int? Height { get; set; }

    /// <summary>Optional FFprobe / TagLib overflow for future UI.</summary>
    public string? MetadataJson { get; set; }

    /// <summary>Path relative to OrangeTv media-cache root, e.g. thumbnails/{id}.jpg</summary>
    public string? ThumbnailRelativePath { get; set; }

    public DateTime LastScannedAtUtc { get; set; }

    public string? LastScanError { get; set; }

    public DateTime CreatedAtUtc { get; set; }

    public DateTime UpdatedAtUtc { get; set; }
}
