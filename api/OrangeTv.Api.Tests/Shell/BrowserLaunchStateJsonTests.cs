using System.Text.Json;
using OrangeTv.Api.Shell;
using Xunit;

namespace OrangeTv.Api.Tests.Shell;

public sealed class BrowserLaunchStateJsonTests
{
    [Fact]
    public void Round_trips_with_web_json_defaults()
    {
        var original = new BrowserLaunchState(4242, new DateTime(2025, 1, 15, 14, 30, 0, DateTimeKind.Utc));
        var json = JsonSerializer.Serialize(original, BrowserShellJson.WebOptions);
        var back = JsonSerializer.Deserialize<BrowserLaunchState>(json, BrowserShellJson.WebOptions);

        Assert.NotNull(back);
        Assert.Equal(original.ProcessId, back!.ProcessId);
        Assert.Equal(original.StartedAtUtc, back.StartedAtUtc);
    }
}
