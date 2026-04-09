namespace OrangeTv.Api.Library;

public sealed record LibraryScanSummary(
    int DiscoveredFiles,
    int InsertedOrUpdated,
    int SkippedUnchanged,
    int RemovedMissing,
    int Errors);
