using System.Diagnostics;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using OrangeTv.Api.Platform;
using TagLib;
using TFile = TagLib.File;

namespace OrangeTv.Api.Library;

public sealed class FfProbeMediaMetadataExtractor : IMediaMetadataExtractor
{
    private const int TimeoutMs = 30000;
    private readonly ILogger<FfProbeMediaMetadataExtractor> _logger;
    private readonly IPlatformEnvironment _platform;

    public FfProbeMediaMetadataExtractor(
        ILogger<FfProbeMediaMetadataExtractor> logger,
        IPlatformEnvironment platform)
    {
        _logger = logger;
        _platform = platform;
    }

    public async Task<MediaMetadataResult> ExtractAsync(string filePath, CancellationToken cancellationToken)
    {
        var ffprobe = FindFfprobe();

        try
        {
            var psi = new ProcessStartInfo
            {
                FileName = ffprobe,
                UseShellExecute = false,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                CreateNoWindow = true,
            };
            psi.ArgumentList.Add("-v");
            psi.ArgumentList.Add("quiet");
            psi.ArgumentList.Add("-print_format");
            psi.ArgumentList.Add("json");
            psi.ArgumentList.Add("-show_format");
            psi.ArgumentList.Add("-show_streams");
            psi.ArgumentList.Add(filePath);

            using var proc = Process.Start(psi);
            if (proc is null)
            {
                return TagLibOnly(filePath);
            }

            using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            cts.CancelAfter(TimeoutMs);
            var readTask = proc.StandardOutput.ReadToEndAsync();
            await proc.WaitForExitAsync(cts.Token).ConfigureAwait(false);
            var json = await readTask.ConfigureAwait(false);
            if (proc.ExitCode != 0)
            {
                _logger.LogWarning("ffprobe exited {Code} for {Path}", proc.ExitCode, filePath);
                return MergeWithTagLib(filePath, null, null, null, false, null);
            }

            return ParseFfprobeJson(filePath, json);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "ffprobe failed for {Path}", filePath);
            return TagLibOnly(filePath);
        }
    }

    private string? FindFfprobe()
    {
        foreach (var c in FfToolCandidates.EnumerateFfprobe(_platform))
        {
            try
            {
                if (c == "ffprobe.exe" || c == "ffprobe")
                {
                    return c;
                }

                if (System.IO.File.Exists(c))
                {
                    return c;
                }
            }
            catch
            {
                // try next
            }
        }

        return "ffprobe";
    }

    private MediaMetadataResult ParseFfprobeJson(string filePath, string json)
    {
        double? duration = null;
        int? width = null;
        int? height = null;
        var hasVideo = false;
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;
        if (root.TryGetProperty("format", out var format) &&
            format.TryGetProperty("duration", out var durEl))
        {
            if (durEl.ValueKind == JsonValueKind.String &&
                double.TryParse(durEl.GetString(), System.Globalization.NumberStyles.Float,
                    System.Globalization.CultureInfo.InvariantCulture, out var d))
            {
                duration = d;
            }
            else if (durEl.ValueKind == JsonValueKind.Number && durEl.TryGetDouble(out var d2))
            {
                duration = d2;
            }
        }

        if (root.TryGetProperty("streams", out var streams) && streams.ValueKind == JsonValueKind.Array)
        {
            foreach (var stream in streams.EnumerateArray())
            {
                if (!stream.TryGetProperty("codec_type", out var ct))
                {
                    continue;
                }

                var codecType = ct.GetString();
                if (codecType == "video")
                {
                    hasVideo = true;
                    if (stream.TryGetProperty("width", out var w) && w.TryGetInt32(out var wi))
                    {
                        width = wi;
                    }

                    if (stream.TryGetProperty("height", out var h) && h.TryGetInt32(out var hi))
                    {
                        height = hi;
                    }

                    break;
                }
            }
        }

        return MergeWithTagLib(filePath, duration, width, height, hasVideo, json);
    }

    private MediaMetadataResult MergeWithTagLib(
        string filePath,
        double? duration,
        int? width,
        int? height,
        bool hasVideoStream,
        string? metadataJson)
    {
        string? title = null;
        try
        {
            using var tf = TFile.Create(filePath);
            if (!string.IsNullOrWhiteSpace(tf.Tag.Title))
            {
                title = tf.Tag.Title;
            }

            if (duration is null || duration <= 0)
            {
                duration = tf.Properties.Duration.TotalSeconds > 0
                    ? tf.Properties.Duration.TotalSeconds
                    : duration;
            }
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "TagLib could not read {Path}", filePath);
        }

        title ??= Path.GetFileNameWithoutExtension(filePath);

        return new MediaMetadataResult(
            title,
            duration,
            width,
            height,
            hasVideoStream,
            metadataJson);
    }

    private MediaMetadataResult TagLibOnly(string filePath)
    {
        var ext = Path.GetExtension(filePath).ToLowerInvariant();
        var guessVideo = ext is ".mp4" or ".mkv" or ".webm" or ".avi" or ".mov";
        return MergeWithTagLib(filePath, null, null, null, guessVideo, null);
    }
}
