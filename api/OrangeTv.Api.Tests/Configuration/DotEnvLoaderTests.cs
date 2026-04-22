using OrangeTv.Api.Configuration;
using Xunit;

namespace OrangeTv.Api.Tests.Configuration;

public sealed class DotEnvLoaderTests
{
    [Fact]
    public void LoadFile_sets_unset_keys_and_keeps_existing_environment()
    {
        var suffix = Guid.NewGuid().ToString("N");
        var newKey = $"ORANGETV_TEST_NEW_{suffix}";
        var existingKey = $"ORANGETV_TEST_EXISTING_{suffix}";
        var path = Path.Combine(Path.GetTempPath(), $"orange-tv-{suffix}.env");

        try
        {
            Environment.SetEnvironmentVariable(existingKey, "from-environment");
            File.WriteAllLines(
                path,
                new[]
                {
                    "# comment",
                    $"{newKey}=\"from-file\"",
                    $"{existingKey}=from-file",
                });

            DotEnvLoader.LoadFile(path);

            Assert.Equal("from-file", Environment.GetEnvironmentVariable(newKey));
            Assert.Equal("from-environment", Environment.GetEnvironmentVariable(existingKey));
        }
        finally
        {
            Environment.SetEnvironmentVariable(newKey, null);
            Environment.SetEnvironmentVariable(existingKey, null);
            if (File.Exists(path))
            {
                File.Delete(path);
            }
        }
    }
}
