using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using OrangeTv.Api.Configuration;
using OrangeTv.Api.Data;
using OrangeTv.Api.Data.Entities;
using OrangeTv.Api.Platform;
using OrangeTv.Api.Shell;

namespace OrangeTv.Api.Library;

public sealed class LibraryScannerService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly LibraryRootsResolver _rootsResolver;
    private readonly IMediaMetadataExtractor _metadataExtractor;
    private readonly IMediaThumbnailGenerator _thumbnailGenerator;
    private readonly IOptions<OrangetvApiOptions> _options;
    private readonly IPlatformEnvironment _platform;
    private readonly ILogger<LibraryScannerService> _logger;
    private readonly SemaphoreSlim _scanGate = new(1, 1);

    public LibraryScannerService(
        IServiceScopeFactory scopeFactory,
        LibraryRootsResolver rootsResolver,
        IMediaMetadataExtractor metadataExtractor,
        IMediaThumbnailGenerator thumbnailGenerator,
        IOptions<OrangetvApiOptions> options,
        IPlatformEnvironment platform,
        ILogger<LibraryScannerService> logger)
    {
        _scopeFactory = scopeFactory;
        _rootsResolver = rootsResolver;
        _metadataExtractor = metadataExtractor;
        _thumbnailGenerator = thumbnailGenerator;
        _options = options;
        _platform = platform;
        _logger = logger;
    }

    public async Task<LibraryScanSummary> ScanFullAsync(CancellationToken cancellationToken)
    {
        await _scanGate.WaitAsync(cancellationToken).ConfigureAwait(false);
        try
        {
            return await ScanFullCoreAsync(cancellationToken).ConfigureAwait(false);
        }
        finally
        {
            _scanGate.Release();
        }
    }

    private async Task<LibraryScanSummary> ScanFullCoreAsync(CancellationToken cancellationToken)
    {
        var lib = _options.Value.Library;
        if (!lib.Enabled)
        {
            _logger.LogDebug("Library scan skipped (disabled).");
            return new LibraryScanSummary(0, 0, 0, 0, 0);
        }

        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<OrangeTvDbContext>();
        var roots = await _rootsResolver.GetEffectiveRootsAsync(db, cancellationToken).ConfigureAwait(false);
        if (roots.Count == 0)
        {
            _logger.LogInformation("Library scan: no roots configured.");
            return new LibraryScanSummary(0, 0, 0, 0, 0);
        }

        var extSet = new HashSet<string>(
            lib.FileExtensions.Select(e => e.Trim().ToLowerInvariant()),
            StringComparer.OrdinalIgnoreCase);
        if (extSet.Count == 0)
        {
            extSet.UnionWith([".mp4", ".mkv", ".webm", ".mp3", ".flac"]);
        }

        var discovered = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var orangeRoot = BrowserShellPaths.ResolveOrangeTvDataRoot();
        var thumbDir = MediaLibraryPaths.GetThumbnailsDirectory(orangeRoot);
        Directory.CreateDirectory(thumbDir);

        var insertedOrUpdated = 0;
        var skipped = 0;
        var errors = 0;

        _logger.LogInformation(
            "Library scan starting for {RootCount} root(s).",
            roots.Count);

        foreach (var root in roots)
        {
            if (!Directory.Exists(root))
            {
                _logger.LogWarning("Library scan root does not exist: {Root}", root);
                continue;
            }

            foreach (var file in Directory.EnumerateFiles(root, "*", SearchOption.AllDirectories))
            {
                cancellationToken.ThrowIfCancellationRequested();
                var ext = Path.GetExtension(file).ToLowerInvariant();
                if (!extSet.Contains(ext))
                {
                    continue;
                }

                string norm;
                try
                {
                    norm = _platform.NormalizePath(Path.GetFullPath(file));
                }
                catch
                {
                    continue;
                }

                discovered.Add(norm);

                try
                {
                    var fi = new FileInfo(file);
                    var size = fi.Length;
                    var mtime = fi.LastWriteTimeUtc;
                    var existing = await db.MediaItems
                        .FirstOrDefaultAsync(m => m.FilePath == norm, cancellationToken)
                        .ConfigureAwait(false);

                    if (existing is not null &&
                        MediaScanSkipRules.IsUnchanged(existing.FileSizeBytes, existing.FileModifiedAtUtc, size, mtime))
                    {
                        existing.LastScannedAtUtc = DateTime.UtcNow;
                        existing.LastScanError = null;
                        await db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
                        skipped++;
                        continue;
                    }

                    var meta = await _metadataExtractor.ExtractAsync(file, cancellationToken).ConfigureAwait(false);
                    var id = existing?.Id ?? Guid.NewGuid();
                    var now = DateTime.UtcNow;
                    var thumbFile = Path.Combine(thumbDir, $"{id}.jpg");
                    var thumbRel = $"thumbnails/{id}.jpg";
                    string? thumbStored = null;
                    var thumbOk = await _thumbnailGenerator
                        .TryGenerateAsync(
                            file,
                            meta.DurationSeconds,
                            meta.HasVideoStream,
                            thumbFile,
                            cancellationToken)
                        .ConfigureAwait(false);
                    if (thumbOk)
                    {
                        thumbStored = thumbRel;
                    }

                    if (existing is null)
                    {
                        db.MediaItems.Add(
                            new MediaItemEntity
                            {
                                Id = id,
                                FilePath = norm,
                                FileSizeBytes = size,
                                FileModifiedAtUtc = mtime,
                                Title = meta.Title,
                                DurationSeconds = meta.DurationSeconds,
                                Width = meta.Width,
                                Height = meta.Height,
                                MetadataJson = meta.MetadataJson,
                                ThumbnailRelativePath = thumbStored,
                                LastScannedAtUtc = now,
                                LastScanError = null,
                                CreatedAtUtc = now,
                                UpdatedAtUtc = now,
                            });
                    }
                    else
                    {
                        existing.FileSizeBytes = size;
                        existing.FileModifiedAtUtc = mtime;
                        existing.Title = meta.Title;
                        existing.DurationSeconds = meta.DurationSeconds;
                        existing.Width = meta.Width;
                        existing.Height = meta.Height;
                        existing.MetadataJson = meta.MetadataJson;
                        existing.ThumbnailRelativePath = thumbStored ?? existing.ThumbnailRelativePath;
                        existing.LastScannedAtUtc = now;
                        existing.LastScanError = null;
                        existing.UpdatedAtUtc = now;
                    }

                    await db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
                    insertedOrUpdated++;
                }
                catch (Exception ex)
                {
                    errors++;
                    _logger.LogWarning(ex, "Library scan error for {Path}", file);
                    try
                    {
                        var normPath = _platform.NormalizePath(Path.GetFullPath(file));
                        var row = await db.MediaItems.FirstOrDefaultAsync(m => m.FilePath == normPath, cancellationToken)
                            .ConfigureAwait(false);
                        if (row is not null)
                        {
                            row.LastScanError = ex.Message.Length > 4000 ? ex.Message[..4000] : ex.Message;
                            row.UpdatedAtUtc = DateTime.UtcNow;
                            await db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
                        }
                    }
                    catch
                    {
                        // ignore secondary failures
                    }
                }
            }
        }

        var removed = 0;
        var tracked = await db.MediaItems.ToListAsync(cancellationToken).ConfigureAwait(false);
        foreach (var item in tracked)
        {
            cancellationToken.ThrowIfCancellationRequested();
            if (discovered.Contains(item.FilePath))
            {
                continue;
            }

            if (!File.Exists(item.FilePath))
            {
                db.MediaItems.Remove(item);
                removed++;
            }
        }

        if (removed > 0)
        {
            await db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        }

        _logger.LogInformation(
            "Library scan finished: discovered {Discovered}, upserted {Upserted}, skipped unchanged {Skipped}, removed missing {Removed}, errors {Errors}",
            discovered.Count,
            insertedOrUpdated,
            skipped,
            removed,
            errors);

        return new LibraryScanSummary(discovered.Count, insertedOrUpdated, skipped, removed, errors);
    }
}
