using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using OrangeTv.Api.Configuration;

namespace OrangeTv.Api.Shell;

public static class BrowserShellOptionsConfiguration
{
    public static IServiceCollection ConfigureBrowserShellOptions(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.Configure<BrowserShellOptions>(configuration.GetSection(BrowserShellOptions.SectionName));
        services.Configure<BrowserShellOptions>(
            configuration.GetSection($"{OrangetvApiOptions.SectionName}:{BrowserShellOptions.SectionName}"));
        return services;
    }
}
