using System.ComponentModel;
using System.Diagnostics;
using System.Text.Json;
using Microsoft.Extensions.Options;
using OrangeTv.Api.Platform;

namespace OrangeTv.Api.Shell;

public sealed class ChromiumShellHostedService : BackgroundService
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

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

            var launchStatePath = GetLaunchStatePath();

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
        if (Uri.TryCreate(options.LauncherUrl, UriKind.Absolute, out var launcherUri))
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

        foreach (var candidate in GetExecutableCandidates())
        {
            attemptedExecutables.Add(candidate);

            try
            {
                var process = Process.Start(BuildStartInfo(candidate, launcherUri));
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

    private ProcessStartInfo BuildStartInfo(string executable, Uri launcherUri)
    {
        var startInfo = new ProcessStartInfo
        {
            FileName = executable,
            UseShellExecute = false,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
        };

        foreach (var argument in BuildBrowserArguments(launcherUri))
        {
            startInfo.ArgumentList.Add(argument);
        }

        return startInfo;
    }

    private IEnumerable<string> BuildBrowserArguments(Uri launcherUri)
    {
        yield return "--no-first-run";
        yield return "--no-default-browser-check";
        yield return "--disable-session-crashed-bubble";
        yield return $"--user-data-dir={GetUserDataDirectory()}";

        if (options.StartFullscreen)
        {
            yield return "--start-fullscreen";
        }

        if (options.UseAppMode)
        {
            yield return $"--app={launcherUri}";
            yield break;
        }

        yield return "--new-window";
        yield return launcherUri.ToString();
    }

    private IEnumerable<string> GetExecutableCandidates()
    {
        if (!string.IsNullOrWhiteSpace(options.ExecutablePath))
        {
            yield return options.ExecutablePath.Trim();
        }

        if (platformEnvironment.IsLinux)
        {
            yield return "chromium-browser";
            yield return "chromium";
            yield return "google-chrome";
            yield return "google-chrome-stable";
            yield break;
        }

        if (platformEnvironment.IsWindows)
        {
            foreach (var path in GetWindowsExecutableCandidates())
            {
                yield return path;
            }

            yield break;
        }

        yield return "chromium-browser";
        yield return "chromium";
        yield return "google-chrome";
    }

    private IEnumerable<string> GetWindowsExecutableCandidates()
    {
        yield return "chrome.exe";

        var programFiles = Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles);
        if (!string.IsNullOrWhiteSpace(programFiles))
        {
            yield return Path.Combine(programFiles, "Google", "Chrome", "Application", "chrome.exe");
        }

        var programFilesX86 = Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86);
        if (!string.IsNullOrWhiteSpace(programFilesX86))
        {
            yield return Path.Combine(programFilesX86, "Google", "Chrome", "Application", "chrome.exe");
        }

        var localAppData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
        if (!string.IsNullOrWhiteSpace(localAppData))
        {
            yield return Path.Combine(localAppData, "Google", "Chrome", "Application", "chrome.exe");
        }
    }

    private string GetUserDataDirectory()
    {
        if (!string.IsNullOrWhiteSpace(options.UserDataDir))
        {
            return Path.GetFullPath(options.UserDataDir.Trim());
        }

        return Path.Combine(GetOrangeTvDataRoot(), "browser-shell", "profile");
    }

    private string GetLaunchStatePath()
    {
        return Path.Combine(GetOrangeTvDataRoot(), "browser-shell", "launch-state.json");
    }

    private string GetOrangeTvDataRoot()
    {
        var localAppData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
        if (string.IsNullOrWhiteSpace(localAppData))
        {
            localAppData = Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);
        }

        return Path.Combine(localAppData, "OrangeTv");
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
            var launchState = JsonSerializer.Deserialize<BrowserLaunchState>(File.ReadAllText(launchStatePath), JsonOptions);
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
        File.WriteAllText(launchStatePath, JsonSerializer.Serialize(launchState, JsonOptions));
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

    private sealed record BrowserLaunchState(int ProcessId, DateTime StartedAtUtc);
}
