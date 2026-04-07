using System.Text.Json;

namespace OrangeTv.Api.Shell;

public static class BrowserShellJson
{
    public static JsonSerializerOptions WebOptions { get; } = new(JsonSerializerDefaults.Web);
}
