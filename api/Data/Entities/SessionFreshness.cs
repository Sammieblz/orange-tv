namespace OrangeTv.Api.Data.Entities;

/// <summary>
/// Opaque UX hint for streaming session state (no credential inspection).
/// </summary>
public enum SessionFreshness
{
    Unknown = 0,
    LikelyActive = 1,
    PossiblyStale = 2,
    ResetSuggested = 3,
}
