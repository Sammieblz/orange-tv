using System.Text.Json;

namespace OrangeTv.Api.Recommendations;

/// <summary>Best-effort genre extraction from FFprobe/TagLib JSON blobs stored on <c>media_items.MetadataJson</c>.</summary>
public static class MediaGenreExtractor
{
    /// <summary>Returns normalized genre text (trimmed) or null if unknown.</summary>
    public static string? TryExtractGenre(string? metadataJson)
    {
        if (string.IsNullOrWhiteSpace(metadataJson))
        {
            return null;
        }

        try
        {
            using var doc = JsonDocument.Parse(metadataJson);
            var root = doc.RootElement;
            if (root.ValueKind != JsonValueKind.Object)
            {
                return null;
            }

            // Common ffprobe-style: { "format": { "tags": { "genre": "..." } } }
            if (TryGetGenreFromTags(root, "format", out var g))
            {
                return Normalize(g);
            }

            // Flat tags
            if (root.TryGetProperty("tags", out var tags) && tags.ValueKind == JsonValueKind.Object)
            {
                if (TryGetStringProperty(tags, "genre", out var flat))
                {
                    return Normalize(flat);
                }
            }

            // streams[].tags.genre
            if (root.TryGetProperty("streams", out var streams) && streams.ValueKind == JsonValueKind.Array)
            {
                foreach (var stream in streams.EnumerateArray())
                {
                    if (stream.ValueKind != JsonValueKind.Object)
                    {
                        continue;
                    }

                    if (stream.TryGetProperty("tags", out var st) && st.ValueKind == JsonValueKind.Object)
                    {
                        if (TryGetStringProperty(st, "genre", out var sg))
                        {
                            return Normalize(sg);
                        }
                    }
                }
            }
        }
        catch (JsonException)
        {
            return null;
        }

        return null;
    }

    private static bool TryGetGenreFromTags(JsonElement root, string childName, out string value)
    {
        value = "";
        if (!root.TryGetProperty(childName, out var child) || child.ValueKind != JsonValueKind.Object)
        {
            return false;
        }

        if (!child.TryGetProperty("tags", out var tags) || tags.ValueKind != JsonValueKind.Object)
        {
            return false;
        }

        return TryGetStringProperty(tags, "genre", out value);
    }

    private static bool TryGetStringProperty(JsonElement obj, string name, out string value)
    {
        value = "";
        if (!obj.TryGetProperty(name, out var p))
        {
            return false;
        }

        if (p.ValueKind == JsonValueKind.String)
        {
            value = p.GetString() ?? "";
            return value.Length > 0;
        }

        return false;
    }

    private static string? Normalize(string s)
    {
        var t = s.Trim();
        return t.Length == 0 ? null : t;
    }
}
