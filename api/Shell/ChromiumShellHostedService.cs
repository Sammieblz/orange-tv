using System.ComponentModel;
using System.Diagnostics;
using System.Text.Json;
using Microsoft.Extensions.Options;
using OrangeTv.Api.Platform;

namespace OrangeTv.Api.Shell;

public sealed class ChromiumShellHostedService : BackgroundService
{
    private readonly BrowserShellOptions options;
    private readonly IHostApplicationLifetime applicationLifetime;
    private readonly IHostEnvironment hostEnvironment;
    private readonly IPlatformEnvironment platformEnvironment;
    private readonly ILogger<ChromiumShellHostedService> logger;

    public ChromiumShellHostedService(
        IOptions<BrowserShellOptions> options,
        IHostApplicationLifetime applicationLifetime,
        IHostEnvironment hostEnvironment,
        IPlatformEnvironment platformEnvironment,
        ILogger<ChromiumShellHostedService> logger)
    {
        this.options = options.Value;
        this.applicationLifetime = applicationLifetime;
        this.hostEnvironment = hostEnvironment;
        this.platformEnvironment = platformEnvironment;
        this.logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        try
        {
            if (!options.Enabled)
            {
                logger.LogDebug("Browser shell auto-launch is disabled.");
                return;
            }

            if (!hostEnvironment.IsDevelopment())
            {
                logger.LogDebug("Browser shell auto-launch only runs in Development.");
                return;
            }

            var launcherUri = GetLauncherUri();
            if (launcherUri is null)
            {
                return;
            }

            await WaitForApplicationStartedAsync(stoppingToken);

            var launchStatePath = BrowserShellPaths.GetLaunchStatePath(BrowserShellPaths.ResolveOrangeTvDataRoot());

            if (TryGetRunningShellProcess(launchStatePath, out var existingProcess))
            {
                logger.LogInformation(
                    "Browser shell already running with PID {ProcessId}; skipping duplicate launch.",
                    existingProcess!.Id);
                existingProcess.Dispose();
                return;
            }

            if (!await WaitForLauncherAsync(launcherUri, stoppingToken))
            {
                logger.LogWarning(
                    "Launcher URL {LauncherUrl} did not become ready within {TimeoutSeconds}s; skipping browser auto-launch.",
                    launcherUri,
                    options.ReadyTimeoutSeconds);
                return;
            }

            if (TryGetRunningShellProcess(launchStatePath, out existingProcess))
            {
                logger.LogInformation(
                    "Browser shell started while waiting for the launcher; reusing PID {ProcessId}.",
                    existingProcess!.Id);
                existingProcess.Dispose();
                return;
            }

            var launchResult = TryLaunchShell(launcherUri);
            if (!launchResult.Success)
            {
                logger.LogWarning(
                    "Unable to auto-launch Chromium shell. Tried: {Candidates}. Set {ConfigKey} to override the executable path.",
                    string.Join(", ", launchResult.AttemptedExecutables),
                    "ORANGETV_API__BrowserShell__ExecutablePath");
                return;
            }

            var launchedProcess = launchResult.Process!;
            BeginDiscardingBrowserOutput(launchedProcess);
            PersistLaunchState(launchStatePath, launchedProcess);

            logger.LogInformation(
                "Browser shell launched with PID {ProcessId} using {Executable}.",
                launchedProcess.Id,
                launchResult.ExecutableUsed);
        }
        catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
        {
            logger.LogDebug("Browser shell auto-launch canceled during shutdown.");
        }
    }

    private async Task WaitForApplicationStartedAsync(CancellationToken stoppingToken)
    {
        if (applicationLifetime.ApplicationStarted.IsCancellationRequested)
        {
            return;
        }

        var startedTcs = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        using var startedRegistration = applicationLifetime.ApplicationStarted.Register(
            static state => ((TaskCompletionSource)state!).TrySetResult(),
            startedTcs);
        using var stoppedRegistration = stoppingToken.Register(
            static state => ((TaskCompletionSource)state!).TrySetCanceled(),
            startedTcs);

        await startedTcs.Task.ConfigureAwait(false);
    }

    private Uri? GetLauncherUri()
    {
        if (BrowserShellLauncherUri.TryCreateAbsolute(options.LauncherUrl, out var launcherUri))
        {
            return launcherUri;
        }

        logger.LogWarning(
            "Browser shell auto-launch was enabled, but BrowserShell:LauncherUrl is invalid: {LauncherUrl}",
            options.LauncherUrl);
        return null;
    }

    private async Task<bool> WaitForLauncherAsync(Uri launcherUri, CancellationToken stoppingToken)
    {
        using var httpClient = new HttpClient
        {
            Timeout = TimeSpan.FromSeconds(2),
        };

        var timeout = TimeSpan.FromSeconds(Math.Max(1, options.ReadyTimeoutSeconds));
        var pollDelay = TimeSpan.FromMilliseconds(Math.Max(200, options.ReadyPollIntervalMilliseconds));
        var startedAt = DateTimeOffset.UtcNow;

        while (DateTimeOffset.UtcNow - startedAt < timeout && !stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var request = new HttpRequestMessage(HttpMethod.Get, launcherUri);
                using var response = await httpClient.SendAsync(request, stoppingToken).ConfigureAwait(false);
                if (response.IsSuccessStatusCode)
                {
                    return true;
                }
            }
            catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException)
            {
                logger.LogDebug(ex, "Waiting for launcher URL {LauncherUrl} to become reachable.", launcherUri);
            }

            await Task.Delay(pollDelay, stoppingToken).ConfigureAwait(false);
        }

        return false;
    }

    private BrowserLaunchAttempt TryLaunchShell(Uri launcherUri)
    {
        var attemptedExecutables = new List<string>();
        var orangeTvRoot = BrowserShellPaths.ResolveOrangeTvDataRoot();
        var userDataDir = BrowserShellPaths.GetUserDataDirectory(options, orangeTvRoot);

        foreach (var candidate in BrowserShellExecutableCandidates.Enumerate(options, platformEnvironment))
        {
            attemptedExecutables.Add(candidate);

            try
            {
                var process = Process.Start(BuildStartInfo(candidate, launcherUri, userDataDir));
                if (process is not null)
                {
                    return new BrowserLaunchAttempt(true, process, candidate, attemptedExecutables);
                }
            }
            catch (Win32Exception ex)
            {
                logger.LogDebug(ex, "Browser executable {Executable} was not available.", candidate);
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Launching browser executable {Executable} failed.", candidate);
            }
        }

        return new BrowserLaunchAttempt(false, null, null, attemptedExecutables);
    }

    private ProcessStartInfo BuildStartInfo(string executable, Uri launcherUri, string userDataDirectory)
    {
        var startInfo = new ProcessStartInfo
        {
            FileName = executable,
            UseShellExecute = false,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
        };

        foreach (var argument in BrowserShellChromeArguments.BuildArguments(launcherUri, options, userDataDirectory))
        {
            startInfo.ArgumentList.Add(argument);
        }

        return startInfo;
    }

    private bool TryGetRunningShellProcess(string launchStatePath, out Process? process)
    {
        process = null;

        if (!File.Exists(launchStatePath))
        {
            return false;
        }

        try
        {
            var launchState = JsonSerializer.Deserialize<BrowserLaunchState>(
                File.ReadAllText(launchStatePath),
                BrowserShellJson.WebOptions);
            if (launchState is null)
            {
                File.Delete(launchStatePath);
                return false;
            }

            process = Process.GetProcessById(launchState.ProcessId);
            if (process.HasExited)
            {
                process.Dispose();
                process = null;
                File.Delete(launchStatePath);
                return false;
            }

            var startedAtUtc = process.StartTime.ToUniversalTime();
            if (startedAtUtc != launchState.StartedAtUtc)
            {
                process.Dispose();
                process = null;
                File.Delete(launchStatePath);
                return false;
            }

            return true;
        }
        catch (Exception ex) when (ex is IOException or JsonException or ArgumentException or InvalidOperationException)
        {
            logger.LogDebug(ex, "Clearing stale browser shell launch state at {LaunchStatePath}.", launchStatePath);
            TryDeleteFile(launchStatePath);
            process?.Dispose();
            process = null;
            return false;
        }
    }

    private void PersistLaunchState(string launchStatePath, Process launchedProcess)
    {
        var launchState = new BrowserLaunchState(
            launchedProcess.Id,
            launchedProcess.StartTime.ToUniversalTime());

        Directory.CreateDirectory(Path.GetDirectoryName(launchStatePath)!);
        File.WriteAllText(
            launchStatePath,
            JsonSerializer.Serialize(launchState, BrowserShellJson.WebOptions));
    }

    private static void BeginDiscardingBrowserOutput(Process launchedProcess)
    {
        launchedProcess.EnableRaisingEvents = true;
        launchedProcess.Exited += (_, _) => launchedProcess.Dispose();

        _ = Task.Run(async () =>
        {
            try
            {
                await launchedProcess.StandardOutput.ReadToEndAsync().ConfigureAwait(false);
            }
            catch
            {
                // Best-effort stream drain only.
            }
        });

        _ = Task.Run(async () =>
        {
            try
            {
                await launchedProcess.StandardError.ReadToEndAsync().ConfigureAwait(false);
            }
            catch
            {
                // Best-effort stream drain only.
            }
        });
    }

    private static void TryDeleteFile(string path)
    {
        try
        {
            if (File.Exists(path))
            {
                File.Delete(path);
            }
        }
        catch
        {
            // Best-effort cleanup only.
        }
    }

    private sealed record BrowserLaunchAttempt(
        bool Success,
        Process? Process,
        string? ExecutableUsed,
        IReadOnlyList<string> AttemptedExecutables);
}
