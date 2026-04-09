using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using OrangeTv.Api.Configuration;
using Xunit;

namespace OrangeTv.Api.Tests.Configuration;

public sealed class OrangetvApiOptionsBindingTests
{
    [Fact]
    public void Binds_Data_SqlitePath_from_ORANGETV_API_section()
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(
                new Dictionary<string, string?>
                {
                    ["ORANGETV_API:Data:SqlitePath"] = @"C:/data/orange-tv.db",
                })
            .Build();

        var services = new ServiceCollection();
        services.Configure<OrangetvApiOptions>(configuration.GetSection(OrangetvApiOptions.SectionName));
        using var provider = services.BuildServiceProvider();

        var options = provider.GetRequiredService<IOptions<OrangetvApiOptions>>().Value;

        Assert.Equal(@"C:/data/orange-tv.db", options.Data.SqlitePath);
    }

    [Fact]
    public void Binds_when_sqlite_path_missing_as_null()
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>())
            .Build();

        var services = new ServiceCollection();
        services.Configure<OrangetvApiOptions>(configuration.GetSection(OrangetvApiOptions.SectionName));
        using var provider = services.BuildServiceProvider();

        var options = provider.GetRequiredService<IOptions<OrangetvApiOptions>>().Value;

        Assert.Null(options.Data.SqlitePath);
    }

    [Fact]
    public void Binds_Launch_ChromeProfilesRoot_from_ORANGETV_API_section()
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(
                new Dictionary<string, string?>
                {
                    ["ORANGETV_API:Launch:ChromeProfilesRoot"] = @"D:/profiles/chrome-root",
                })
            .Build();

        var services = new ServiceCollection();
        services.Configure<OrangetvApiOptions>(configuration.GetSection(OrangetvApiOptions.SectionName));
        using var provider = services.BuildServiceProvider();

        var options = provider.GetRequiredService<IOptions<OrangetvApiOptions>>().Value;

        Assert.Equal(@"D:/profiles/chrome-root", options.Launch.ChromeProfilesRoot);
    }

    [Fact]
    public void Binds_Library_Enabled_and_Debounce_from_ORANGETV_API_section()
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(
                new Dictionary<string, string?>
                {
                    ["ORANGETV_API:Library:Enabled"] = "true",
                    ["ORANGETV_API:Library:DebounceMilliseconds"] = "5000",
                })
            .Build();

        var services = new ServiceCollection();
        services.Configure<OrangetvApiOptions>(configuration.GetSection(OrangetvApiOptions.SectionName));
        using var provider = services.BuildServiceProvider();

        var options = provider.GetRequiredService<IOptions<OrangetvApiOptions>>().Value;

        Assert.True(options.Library.Enabled);
        Assert.Equal(5000, options.Library.DebounceMilliseconds);
    }
}
