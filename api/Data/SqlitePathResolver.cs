using Microsoft.Extensions.Options;
using OrangeTv.Api.Configuration;

namespace OrangeTv.Api.Data;

/// <summary>
/// Resolves the SQLite file path and ensures the parent directory exists.
/// </summary>
public sealed class SqlitePathResolver(IOptions<OrangetvApiOptions> options)
{
    private readonly OrangetvApiOptions _options = options.Value;

    public string Resolve()
    {
        var configured = _options.Data.SqlitePath;
        if (!string.IsNullOrWhiteSpace(configured))
        {
            return Path.GetFullPath(configured.Trim());
        }

        var root = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "OrangeTv");
        return Path.Combine(root, "orange-tv.db");
    }

    public void EnsureParentDirectoryExists(string absoluteDbPath)
    {
        var dir = Path.GetDirectoryName(absoluteDbPath);
        if (!string.IsNullOrEmpty(dir))
        {
            Directory.CreateDirectory(dir);
        }
    }
}
