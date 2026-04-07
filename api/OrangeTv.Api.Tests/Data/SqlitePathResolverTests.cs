using Microsoft.Extensions.Options;
using OrangeTv.Api.Configuration;
using OrangeTv.Api.Data;
using Xunit;

namespace OrangeTv.Api.Tests.Data;

public sealed class SqlitePathResolverTests
{
    [Fact]
    public void Resolve_with_no_path_configured_uses_local_application_data_orangetv()
    {
        var resolver = new SqlitePathResolver(
            Options.Create(
                new OrangetvApiOptions
                {
                    Data = new DataOptions { SqlitePath = null },
                }));

        var path = resolver.Resolve();

        var expected = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "OrangeTv",
            "orange-tv.db");
        Assert.Equal(expected, path);
    }

    [Fact]
    public void Resolve_with_whitespace_only_config_falls_back_to_default()
    {
        var defaultPath = new SqlitePathResolver(
                Options.Create(new OrangetvApiOptions { Data = new DataOptions { SqlitePath = null } }))
            .Resolve();
        var whitespacePath = new SqlitePathResolver(
                Options.Create(
                    new OrangetvApiOptions
                    {
                        Data = new DataOptions { SqlitePath = "   " },
                    }))
            .Resolve();

        Assert.Equal(defaultPath, whitespacePath);
    }

    [Fact]
    public void Resolve_with_configured_path_trims_and_returns_full_path()
    {
        var raw = Path.Combine(Path.GetTempPath(), $"otv-config-{Guid.NewGuid():N}.db");
        var resolver = new SqlitePathResolver(
            Options.Create(
                new OrangetvApiOptions
                {
                    Data = new DataOptions { SqlitePath = $"  {raw}  " },
                }));

        Assert.Equal(Path.GetFullPath(raw), resolver.Resolve());
    }

    [Fact]
    public void EnsureParentDirectoryExists_creates_missing_parent_directories()
    {
        var root = Path.Combine(Path.GetTempPath(), $"otv-sqlite-{Guid.NewGuid():N}");
        var dbPath = Path.Combine(root, "nested", "db.db");

        try
        {
            var resolver = new SqlitePathResolver(Options.Create(new OrangetvApiOptions()));
            resolver.EnsureParentDirectoryExists(dbPath);

            var parent = Path.GetDirectoryName(dbPath);
            Assert.NotNull(parent);
            Assert.True(Directory.Exists(parent));
        }
        finally
        {
            try
            {
                if (Directory.Exists(root))
                {
                    Directory.Delete(root, recursive: true);
                }
            }
            catch
            {
                // best-effort temp cleanup
            }
        }
    }
}
