using System.Collections.Concurrent;
using System.Diagnostics;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using OrangeTv.Api.Configuration;
using OrangeTv.Api.Data;
using OrangeTv.Api.Data.Entities;
using OrangeTv.Api.Launch;
using OrangeTv.Api.Platform;
using OrangeTv.Api.Shell;

namespace OrangeTv.Api.Services;

public sealed class ProcessLaunchService
{
    private static readonly ConcurrentDictionary<Guid, Process> Tracked = new();

    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<ProcessLaunchService> _logger;
    private readonly IOptions<OrangetvApiOptions> _apiOptions;
    private readonly IOptions<BrowserShellOptions> _browserShellOptions;
    private readonly IPlatformEnvironment _platform;
    private readonly WatchHistoryWriteHelper _watch;

    public ProcessLaunchService(
        IServiceScopeFactory scopeFactory,
        ILogger<ProcessLaunchService> logger,
        IOptions<OrangetvApiOptions> apiOptions,
        IOptions<BrowserShellOptions> browserShellOptions,
        IPlatformEnvironment platform,
        WatchHistoryWriteHelper watch)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
        _apiOptions = apiOptions;
        _browserShellOptions = browserShellOptions;
        _platform = platform;
        _watch = watch;
    }

    public async Task<LaunchOutcome> LaunchAsync(string appId, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(appId))
        {
            return LaunchOutcome.Failed("invalid-app-id", StatusCodes.Status400BadRequest);
        }

        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<OrangeTvDbContext>();
        var app = await db.Apps.AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == appId, cancellationToken)
            .ConfigureAwait(false);
        if (app is null)
        {
            return LaunchOutcome.Failed("app-not-found", StatusCodes.Status404NotFound);
        }

        var type = app.Type?.Trim().ToLowerInvariant();
        return type switch
        {
            "chrome" => await LaunchChromeAsync(app, db, cancellationToken).ConfigureAwait(false),
            "mpv" => await LaunchMpvAsync(app, db, cancellationToken).ConfigureAwait(false),
            _ => LaunchOutcome.Failed("unsupported-app-type", StatusCodes.Status400BadRequest),
        };
    }

    /// <summary>Launches MPV for an indexed <see cref="MediaItemEntity"/> (uses seeded <see cref="LocalMediaAppConstants.AppId"/>).</summary>
    public async Task<LaunchOutcome> LaunchMediaItemAsync(Guid mediaItemId, CancellationToken cancellationToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<OrangeTvDbContext>();
        var media = await db.MediaItems.AsNoTracking()
            .FirstOrDefaultAsync(m => m.Id == mediaItemId, cancellationToken)
            .ConfigureAwait(false);
        if (media is null)
        {
            return LaunchOutcome.Failed("media-not-found", StatusCodes.Status404NotFound);
        }

        string mediaPath;
        try
        {
            mediaPath = Path.GetFullPath(media.FilePath);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Invalid MPV media path for media item {MediaId}.", mediaItemId);
            return LaunchOutcome.Failed("mpv-invalid-path", StatusCodes.Status400BadRequest);
        }

        if (!File.Exists(mediaPath))
        {
            _logger.LogWarning("MPV media file not found: {Path}", mediaPath);
            return LaunchOutcome.Failed("mpv-media-missing", StatusCodes.Status400BadRequest);
        }

        var appExists = await db.Apps.AsNoTracking()
            .AnyAsync(a => a.Id == LocalMediaAppConstants.AppId, cancellationToken)
            .ConfigureAwait(false);
        if (!appExists)
        {
            return LaunchOutcome.Failed("local-media-app-missing", StatusCodes.Status503ServiceUnavailable);
        }

        var process = TryStartMpvProcess(mediaPath);
        if (process is null)
        {
            _logger.LogWarning("No MPV executable could start for media item {MediaId}.", mediaItemId);
            return LaunchOutcome.Failed("mpv-not-found", StatusCodes.Status503ServiceUnavailable);
        }

        return await FinalizeLaunchedProcessAsync(
                process,
                LocalMediaAppConstants.AppId,
                mediaItemId,
                LaunchTrackKind.Mpv,
                cancellationToken)
            .ConfigureAwait(false);
    }

    private async Task<LaunchOutcome> LaunchChromeAsync(
        AppEntity app,
        OrangeTvDbContext db,
        CancellationToken cancellationToken)
    {
        var url = string.IsNullOrWhiteSpace(app.LaunchUrl) ? "about:blank" : app.LaunchUrl.Trim();
        var orangeRoot = BrowserShellPaths.ResolveOrangeTvDataRoot();
        var settingsRow = await db.Settings.AsNoTracking()
            .FirstOrDefaultAsync(s => s.Key == ChromeProfilePaths.ProfilesRootSettingKey, cancellationToken)
            .ConfigureAwait(false);
        var userDataDir = ChromeProfilePaths.ResolveUserDataDir(
            orangeRoot,
            settingsRow?.Value,
            _apiOptions.Value.Launch.ChromeProfilesRoot,
            app.Id,
            app.ChromeProfileSegment,
            _platform);
        Directory.CreateDirectory(userDataDir);
        _logger.LogInformation(
            "Chrome user-data-dir for {AppId}: {UserDataDir}",
            app.Id,
            userDataDir);

        Process? process = null;
        foreach (var candidate in BrowserShellExecutableCandidates.Enumerate(_browserShellOptions.Value, _platform))
        {
            try
            {
                var psi = new ProcessStartInfo
                {
                    FileName = candidate,
                    UseShellExecute = false,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                };
                foreach (var arg in ChromeStreamingLaunchArguments.Build(
                             url,
                             userDataDir,
                             _apiOptions.Value.Launch.ChromeStreamingUseAppWindow,
                             _apiOptions.Value.Launch.ChromeStreamingStartFullscreen))
                {
                    psi.ArgumentList.Add(arg);
                }

                process = Process.Start(psi);
                if (process is not null)
                {
                    break;
                }
            }
            catch (Exception ex)
            {
                _logger.LogDebug(ex, "Chrome executable {Candidate} was not available.", candidate);
            }
        }

        if (process is null)
        {
            _logger.LogWarning("No Chrome/Chromium executable could start for app {AppId}.", app.Id);
            return LaunchOutcome.Failed("chrome-not-found", StatusCodes.Status503ServiceUnavailable);
        }

        return await FinalizeLaunchedProcessAsync(process, app.Id, null, LaunchTrackKind.Chrome, cancellationToken)
            .ConfigureAwait(false);
    }

    private async Task<LaunchOutcome> LaunchMpvAsync(AppEntity app, OrangeTvDbContext db, CancellationToken cancellationToken)
    {
        var mediaPath = !string.IsNullOrWhiteSpace(app.LaunchUrl)
            ? app.LaunchUrl.Trim()
            : _apiOptions.Value.Launch.SampleMediaPath?.Trim();
        if (string.IsNullOrWhiteSpace(mediaPath))
        {
            return LaunchOutcome.Failed("mpv-no-media-path", StatusCodes.Status400BadRequest);
        }

        try
        {
            mediaPath = Path.GetFullPath(mediaPath);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Invalid MPV media path.");
            return LaunchOutcome.Failed("mpv-invalid-path", StatusCodes.Status400BadRequest);
        }

        if (!File.Exists(mediaPath))
        {
            _logger.LogWarning("MPV media file not found: {Path}", mediaPath);
            return LaunchOutcome.Failed("mpv-media-missing", StatusCodes.Status400BadRequest);
        }

        var mediaItemId = await ResolveMediaItemIdForPathAsync(db, mediaPath, cancellationToken).ConfigureAwait(false);

        var process = TryStartMpvProcess(mediaPath);
        if (process is null)
        {
            _logger.LogWarning("No MPV executable could start for app {AppId}.", app.Id);
            return LaunchOutcome.Failed("mpv-not-found", StatusCodes.Status503ServiceUnavailable);
        }

        return await FinalizeLaunchedProcessAsync(process, app.Id, mediaItemId, LaunchTrackKind.Mpv, cancellationToken)
            .ConfigureAwait(false);
    }

    private static async Task<Guid?> ResolveMediaItemIdForPathAsync(
        OrangeTvDbContext db,
        string fullPath,
        CancellationToken cancellationToken)
    {
        var id = await db.MediaItems.AsNoTracking()
            .Where(m => m.FilePath == fullPath)
            .Select(m => m.Id)
            .FirstOrDefaultAsync(cancellationToken)
            .ConfigureAwait(false);
        return id == Guid.Empty ? null : id;
    }

    private Process? TryStartMpvProcess(string mediaPath)
    {
        foreach (var candidate in MpvExecutableCandidates.Enumerate(_platform))
        {
            try
            {
                var psi = new ProcessStartInfo
                {
                    FileName = candidate,
                    UseShellExecute = false,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                };
                psi.ArgumentList.Add(mediaPath);
                var process = Process.Start(psi);
                if (process is not null)
                {
                    return process;
                }
            }
            catch (Exception ex)
            {
                _logger.LogDebug(ex, "MPV executable {Candidate} was not available.", candidate);
            }
        }

        return null;
    }

    private async Task<LaunchOutcome> FinalizeLaunchedProcessAsync(
        Process process,
        string appId,
        Guid? mediaItemId,
        LaunchTrackKind track,
        CancellationToken cancellationToken)
    {
        process.EnableRaisingEvents = true;
        var sessionId = Guid.NewGuid();
        var pid = process.Id;
        var startedAt = DateTime.UtcNow;

        using (var scope = _scopeFactory.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<OrangeTvDbContext>();
            db.LaunchSessions.Add(
                new LaunchSessionEntity
                {
                    Id = sessionId,
                    AppId = appId,
                    Pid = pid,
                    StartedAtUtc = startedAt,
                    MediaItemId = mediaItemId,
                });

            var startType = track == LaunchTrackKind.Chrome ? WatchEventType.AppLaunched : WatchEventType.PlaybackStarted;
            _watch.AddEvent(
                db,
                new WatchEventEntity
                {
                    Id = Guid.NewGuid(),
                    OccurredAtUtc = startedAt,
                    EventType = startType,
                    LaunchSessionId = sessionId,
                    AppId = appId,
                    MediaItemId = mediaItemId,
                },
                startedAt);

            await db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        }

        Tracked[sessionId] = process;
        _logger.LogInformation(
            "Launched {AppId} session {SessionId} pid {Pid}.",
            appId,
            sessionId,
            pid);

        process.Exited += (_, _) => OnProcessExited(sessionId, process);

        return LaunchOutcome.Succeeded(sessionId, pid);
    }

    private void OnProcessExited(Guid sessionId, Process process)
    {
        int exitCode;
        try
        {
            exitCode = process.ExitCode;
        }
        catch
        {
            exitCode = -1;
        }

        _ = Task.Run(
            async () =>
            {
                try
                {
                    using var scope = _scopeFactory.CreateScope();
                    var db = scope.ServiceProvider.GetRequiredService<OrangeTvDbContext>();
                    var watch = scope.ServiceProvider.GetRequiredService<WatchHistoryWriteHelper>();
                    var row = await db.LaunchSessions.FirstOrDefaultAsync(s => s.Id == sessionId)
                        .ConfigureAwait(false);
                    if (row is not null)
                    {
                        var endedAt = DateTime.UtcNow;
                        var duration = endedAt - row.StartedAtUtc;
                        row.EndedAtUtc = endedAt;
                        row.ExitCode = exitCode;

                        var appRow = await db.Apps.FirstOrDefaultAsync(a => a.Id == row.AppId)
                            .ConfigureAwait(false);
                        if (appRow is not null)
                        {
                            var previousFreshness = appRow.SessionFreshness;
                            var freshness = SessionFreshnessHeuristics.FromExit(exitCode, duration);
                            appRow.LastSessionEndedAtUtc = endedAt;
                            appRow.LastSessionExitCode = exitCode;
                            appRow.SessionFreshness = freshness;
                            appRow.UpdatedAtUtc = endedAt;

                            if (previousFreshness != freshness)
                            {
                                _logger.LogInformation(
                                    "App session freshness transition for {AppId}: {Previous} -> {Current} (exit {ExitCode}, durationMs {DurationMs}).",
                                    row.AppId,
                                    previousFreshness,
                                    freshness,
                                    exitCode,
                                    (long)duration.TotalMilliseconds);
                            }

                            if (freshness is SessionFreshness.ResetSuggested or SessionFreshness.PossiblyStale)
                            {
                                _logger.LogInformation(
                                    "Session reset or stale signal for {AppId}: freshness {Freshness}, exit {ExitCode}.",
                                    row.AppId,
                                    freshness,
                                    exitCode);
                            }
                        }

                        double? positionSeconds = null;
                        double? durationSeconds = null;
                        if (row.MediaItemId is Guid mid)
                        {
                            var media = await db.MediaItems.AsNoTracking()
                                .FirstOrDefaultAsync(m => m.Id == mid)
                                .ConfigureAwait(false);
                            if (media?.DurationSeconds is double total && total > 0)
                            {
                                durationSeconds = total;
                                var elapsed = duration.TotalSeconds;
                                positionSeconds = Math.Min(elapsed, total * 0.999);
                            }
                        }

                        watch.AddEvent(
                            db,
                            new WatchEventEntity
                            {
                                Id = Guid.NewGuid(),
                                OccurredAtUtc = endedAt,
                                EventType = WatchEventType.PlaybackEnded,
                                LaunchSessionId = sessionId,
                                AppId = row.AppId,
                                MediaItemId = row.MediaItemId,
                                PositionSeconds = positionSeconds,
                                DurationSeconds = durationSeconds,
                            },
                            endedAt);

                        await db.SaveChangesAsync().ConfigureAwait(false);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to persist launch session end for {SessionId}.", sessionId);
                }
                finally
                {
                    try
                    {
                        process.Dispose();
                    }
                    catch
                    {
                        // ignore
                    }

                    Tracked.TryRemove(sessionId, out _);
                }
            });

        _logger.LogInformation(
            "Launch session {SessionId} exited with code {ExitCode}.",
            sessionId,
            exitCode);
    }

    private enum LaunchTrackKind
    {
        Chrome,
        Mpv,
    }
}

public sealed record LaunchOutcome(bool Ok, Guid? SessionId, int? Pid, string? Reason, int StatusCode)
{
    public static LaunchOutcome Succeeded(Guid sessionId, int pid) =>
        new(true, sessionId, pid, null, StatusCodes.Status200OK);

    public static LaunchOutcome Failed(string reason, int statusCode) =>
        new(false, null, null, reason, statusCode);
}
