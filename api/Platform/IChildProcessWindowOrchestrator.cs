namespace OrangeTv.Api.Platform;

/// <summary>Minimize / restore externally launched child windows (Chrome, MPV) by OS process id.</summary>
public interface IChildProcessWindowOrchestrator
{
    Task<ChildWindowOpResult> MinimizeAsync(int processId, CancellationToken cancellationToken = default);

    Task<ChildWindowOpResult> ForegroundAsync(int processId, CancellationToken cancellationToken = default);
}

public sealed record ChildWindowOpResult(bool Ok, string? Reason);
