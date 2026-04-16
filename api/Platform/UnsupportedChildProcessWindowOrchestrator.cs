namespace OrangeTv.Api.Platform;

/// <summary>Non-Windows hosts: window orchestration is not implemented (Wayland / wmctrl TBD).</summary>
public sealed class UnsupportedChildProcessWindowOrchestrator : IChildProcessWindowOrchestrator
{
    public Task<ChildWindowOpResult> MinimizeAsync(int processId, CancellationToken cancellationToken = default) =>
        Task.FromResult(new ChildWindowOpResult(false, "unsupported-platform"));

    public Task<ChildWindowOpResult> ForegroundAsync(int processId, CancellationToken cancellationToken = default) =>
        Task.FromResult(new ChildWindowOpResult(false, "unsupported-platform"));
}
