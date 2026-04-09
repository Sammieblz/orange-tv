using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using OrangeTv.Api.Configuration;
using OrangeTv.Api.Data;
using OrangeTv.Api.Platform;

namespace OrangeTv.Api.Library;

/// <summary>
/// Resolves scan roots: settings key <c>library.scanRoots</c> (JSON string array) overrides config
/// <see cref="LibraryOptions.ScanRoots"/> when present and valid.
/// </summary>
public sealed class LibraryRootsResolver
{
    public const string ScanRootsSettingKey = "library.scanRoots";

    private readonly IOptions<OrangetvApiOptions> _options;
    private readonly IPlatformEnvironment _platform;

    public LibraryRootsResolver(
        IOptions<OrangetvApiOptions> options,
        IPlatformEnvironment platform)
    {
        _options = options;
        _platform = platform;
    }

    public async Task<IReadOnlyList<string>> GetEffectiveRootsAsync(
        OrangeTvDbContext db,
        CancellationToken cancellationToken)
    {
        var row = await db.Settings.AsNoTracking()
            .FirstOrDefaultAsync(s => s.Key == ScanRootsSettingKey, cancellationToken)
            .ConfigureAwait(false);
        if (!string.IsNullOrWhiteSpace(row?.Value))
        {
            try
            {
                var parsed = JsonSerializer.Deserialize<string[]>(row.Value.Trim());
                if (parsed is { Length: > 0 })
                {
                    return NormalizeRoots(parsed);
                }
            }
            catch
            {
                // fall through to config
            }
        }

        var fromConfig = _options.Value.Library.ScanRoots;
        return NormalizeRoots(fromConfig ?? []);
    }

    private IReadOnlyList<string> NormalizeRoots(IEnumerable<string> roots)
    {
        var list = new List<string>();
        foreach (var r in roots)
        {
            if (string.IsNullOrWhiteSpace(r))
            {
                continue;
            }

            try
            {
                var full = Path.GetFullPath(r.Trim());
                list.Add(_platform.NormalizePath(full));
            }
            catch
            {
                // skip invalid
            }
        }

        return list;
    }
}
