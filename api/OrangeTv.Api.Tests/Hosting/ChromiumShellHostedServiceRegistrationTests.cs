using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using OrangeTv.Api.Shell;
using OrangeTv.Api.Tests.Support;
using Xunit;

namespace OrangeTv.Api.Tests.Hosting;

public sealed class ChromiumShellHostedServiceRegistrationTests
{
    [Fact]
    public void Test_host_registers_ChromiumShellHostedService()
    {
        using var factory = new ApiWebApplicationFactory();
        var hosted = factory.Services.GetServices<IHostedService>();
        Assert.Contains(hosted, s => s is ChromiumShellHostedService);
    }
}
