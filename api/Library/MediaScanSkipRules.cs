namespace OrangeTv.Api.Library;

/// <summary>
/// Pure helpers for deciding when to skip metadata re-extraction.
/// </summary>
public static class MediaScanSkipRules
{
    public static bool IsUnchanged(long storedSize, DateTime storedMtimeUtc, long fileSize, DateTime fileMtimeUtc) =>
        storedSize == fileSize && storedMtimeUtc == fileMtimeUtc;
}
