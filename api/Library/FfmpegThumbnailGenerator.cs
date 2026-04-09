using System.Diagnostics;
using Microsoft.Extensions.Logging;
using OrangeTv.Api.Platform;

namespace OrangeTv.Api.Library;

public sealed class FfmpegThumbnailGenerator : IMediaThumbnailGenerator
{
    private const int TimeoutMs = 120000;
    private readonly ILogger<FfmpegThumbnailGenerator> _logger;
    private readonly IPlatformEnvironment _platform;

    public FfmpegThumbnailGenerator(
        ILogger<FfmpegThumbnailGenerator> logger,
        IPlatformEnvironment platform)
    {
        _logger = logger;
        _platform = platform;
    }

    public async Task<bool> TryGenerateAsync(
        string filePath,
        double? durationSeconds,
        bool hasVideoStream,
        string outputJpegPath,
        CancellationToken cancellationToken)
    {
        if (!hasVideoStream)
        {
            return false;
        }

        var ffmpeg = FindFfmpeg();
        if (ffmpeg is null)
        {
            _logger.LogDebug("ffmpeg not found; skipping thumbnail for {Path}", filePath);
            return false;
        }

        var seekSeconds = 5.0;
        if (durationSeconds is > 10)
        {
            seekSeconds = Math.Min(durationSeconds.Value * 0.1, 300);
        }

        try
        {
            Directory.CreateDirectory(Path.GetDirectoryName(outputJpegPath)!);
            var psi = new ProcessStartInfo
            {
                FileName = ffmpeg,
                UseShellExecute = false,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                CreateNoWindow = true,
            };
            psi.ArgumentList.Add("-y");
            psi.ArgumentList.Add("-ss");
            psi.ArgumentList.Add(seekSeconds.ToString(System.Globalization.CultureInfo.InvariantCulture));
            psi.ArgumentList.Add("-i");
            psi.ArgumentList.Add(filePath);
            psi.ArgumentList.Add("-vframes");
            psi.ArgumentList.Add("1");
            psi.ArgumentList.Add("-q:v");
            psi.ArgumentList.Add("3");
            psi.ArgumentList.Add(outputJpegPath);

            using var proc = Process.Start(psi);
            if (proc is null)
            {
                return false;
            }

            using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            cts.CancelAfter(TimeoutMs);
            await proc.WaitForExitAsync(cts.Token).ConfigureAwait(false);
            if (proc.ExitCode != 0)
            {
                var err = await proc.StandardError.ReadToEndAsync(cts.Token).ConfigureAwait(false);
                _logger.LogDebug("ffmpeg thumbnail exit {Code} for {Path}: {Err}", proc.ExitCode, filePath, err);
                return false;
            }

            return File.Exists(outputJpegPath);
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "ffmpeg thumbnail failed for {Path}", filePath);
            return false;
        }
    }

    private string? FindFfmpeg()
    {
        foreach (var c in FfToolCandidates.EnumerateFfmpeg(_platform))
        {
            if (c == "ffmpeg.exe" || c == "ffmpeg")
            {
                return c;
            }

            if (File.Exists(c))
            {
                return c;
            }
        }

        return "ffmpeg";
    }
}
