namespace OrangeTv.Api.Shell;

/// <summary>
/// Persisted metadata for a running browser-shell process (JSON in LocalApplicationData).
/// </summary>
public sealed record BrowserLaunchState(int ProcessId, DateTime StartedAtUtc);
