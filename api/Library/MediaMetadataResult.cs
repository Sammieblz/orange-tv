namespace OrangeTv.Api.Library;

public sealed record MediaMetadataResult(
    string? Title,
    double? DurationSeconds,
    int? Width,
    int? Height,
    bool HasVideoStream,
    string? MetadataJson);
