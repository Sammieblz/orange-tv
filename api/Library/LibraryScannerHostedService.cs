using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;
using OrangeTv.Api.Configuration;
using OrangeTv.Api.Data;

namespace OrangeTv.Api.Library;

/// <summary>
/// Debounced <see cref="FileSystemWatcher"/> per library root plus optional startup scan.
/// </summary>
public sealed class LibraryScannerHostedService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly LibraryScannerService _scanner;
    private readonly IOptions<OrangetvApiOptions> _options;
    private readonly IHostEnvironment _environment;
    private readonly ILogger<LibraryScannerHostedService> _logger;
    private readonly object _debounceLock = new();
    private CancellationTokenSource? _debounceCts;

    public LibraryScannerHostedService(
        IServiceScopeFactory scopeFactory,
        LibraryScannerService scanner,
        IOptions<OrangetvApiOptions> options,
        IHostEnvironment environment,
        ILogger<LibraryScannerHostedService> logger)
    {
        _scopeFactory = scopeFactory;
        _scanner = scanner;
        _options = options;
        _environment = environment;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (_environment.IsEnvironment("Testing"))
        {
            _logger.LogDebug("Library scanner hosted service disabled in Testing environment.");
            return;
        }

        var lib = _options.Value.Library;
        if (!lib.Enabled)
        {
            _logger.LogDebug("Library scanner disabled (ORANGETV_API:Library:Enabled=false).");
            return;
        }

        await Task.Delay(2000, stoppingToken).ConfigureAwait(false);

        IReadOnlyList<string> roots;
        using (var scope = _scopeFactory.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<OrangeTvDbContext>();
            var resolver = scope.ServiceProvider.GetRequiredService<LibraryRootsResolver>();
            roots = await resolver.GetEffectiveRootsAsync(db, stoppingToken).ConfigureAwait(false);
        }

        if (roots.Count == 0)
        {
            _logger.LogInformation("Library scanner: no roots configured; watchers not started.");
            return;
        }

        try
        {
            await _scanner.ScanFullAsync(stoppingToken).ConfigureAwait(false);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Initial library scan failed.");
        }

        var watchers = new List<FileSystemWatcher>();
        foreach (var root in roots)
        {
            if (!Directory.Exists(root))
            {
                _logger.LogWarning("Library scan root missing; skipping watcher: {Root}", root);
                continue;
            }

            var w = new FileSystemWatcher(root)
            {
                IncludeSubdirectories = true,
                NotifyFilter = NotifyFilters.FileName |
                               NotifyFilters.DirectoryName |
                               NotifyFilters.Size |
                               NotifyFilters.LastWrite,
            };
            w.Created += OnLibraryChanged;
            w.Changed += OnLibraryChanged;
            w.Deleted += OnLibraryChanged;
            w.Renamed += OnLibraryRenamed;
            w.Error += OnWatcherError;
            w.EnableRaisingEvents = true;
            watchers.Add(w);
            _logger.LogInformation("Library FileSystemWatcher started for {Root}", root);
        }

        try
        {
            await Task.Delay(Timeout.Infinite, stoppingToken).ConfigureAwait(false);
        }
        finally
        {
            foreach (var w in watchers)
            {
                w.EnableRaisingEvents = false;
                w.Dispose();
            }
        }
    }

    private void OnWatcherError(object sender, ErrorEventArgs e)
    {
        _logger.LogWarning(e.GetException(), "Library FileSystemWatcher error.");
    }

    private void OnLibraryChanged(object sender, FileSystemEventArgs e)
    {
        QueueDebouncedRescan();
    }

    private void OnLibraryRenamed(object sender, RenamedEventArgs e)
    {
        QueueDebouncedRescan();
    }

    private void QueueDebouncedRescan()
    {
        var debounceMs = Math.Clamp(_options.Value.Library.DebounceMilliseconds, 500, 60_000);
        lock (_debounceLock)
        {
            _debounceCts?.Cancel();
            _debounceCts?.Dispose();
            _debounceCts = new CancellationTokenSource();
            var token = _debounceCts.Token;
            _ = Task.Run(
                async () =>
                {
                    try
                    {
                        await Task.Delay(debounceMs, token).ConfigureAwait(false);
                        await _scanner.ScanFullAsync(CancellationToken.None).ConfigureAwait(false);
                    }
                    catch (OperationCanceledException)
                    {
                        // superseded by newer event
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Debounced library rescan failed.");
                    }
                },
                CancellationToken.None);
        }
    }
}
