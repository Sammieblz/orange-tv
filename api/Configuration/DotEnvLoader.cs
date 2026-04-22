namespace OrangeTv.Api.Configuration;

public static class DotEnvLoader
{
    public static void LoadNearest(string fileName = ".env", int maxDepth = 8)
    {
        var directory = new DirectoryInfo(Directory.GetCurrentDirectory());
        var visited = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        for (var depth = 0; directory is not null && depth <= maxDepth; depth++)
        {
            var candidate = Path.GetFullPath(Path.Combine(directory.FullName, fileName));
            if (visited.Add(candidate) && File.Exists(candidate))
            {
                LoadFile(candidate);
                return;
            }

            directory = directory.Parent;
        }
    }

    public static void LoadFile(string path)
    {
        foreach (var rawLine in File.ReadLines(path))
        {
            var line = rawLine.Trim();
            if (line.Length == 0 || line.StartsWith('#'))
            {
                continue;
            }

            if (line.StartsWith("export ", StringComparison.Ordinal))
            {
                line = line["export ".Length..].TrimStart();
            }

            var separatorIndex = line.IndexOf('=');
            if (separatorIndex <= 0)
            {
                continue;
            }

            var key = line[..separatorIndex].Trim();
            var value = Unquote(line[(separatorIndex + 1)..].Trim());
            if (key.Length == 0 || Environment.GetEnvironmentVariable(key) is not null)
            {
                continue;
            }

            Environment.SetEnvironmentVariable(key, value);
        }
    }

    private static string Unquote(string value)
    {
        if (value.Length >= 2
            && ((value[0] == '"' && value[^1] == '"')
                || (value[0] == '\'' && value[^1] == '\'')))
        {
            return value[1..^1];
        }

        return value;
    }
}
