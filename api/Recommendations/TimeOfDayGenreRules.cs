namespace OrangeTv.Api.Recommendations;

/// <summary>Maps local hour (0–23) to a bucket and preferred genre substrings (case-insensitive).</summary>
public static class TimeOfDayGenreRules
{
    public enum Bucket
    {
        Late,
        Morning,
        Afternoon,
        Evening,
    }

    public static Bucket GetBucket(int localHour)
    {
        var h = ((localHour % 24) + 24) % 24;
        return h switch
        {
            >= 0 and <= 4 => Bucket.Late,
            >= 5 and <= 11 => Bucket.Morning,
            >= 12 and <= 16 => Bucket.Afternoon,
            >= 17 and <= 23 => Bucket.Evening,
            _ => Bucket.Late,
        };
    }

    /// <summary>Genres preferred for this bucket (substring match against extracted genre).</summary>
    public static IReadOnlyList<string> PreferredGenreSubstrings(Bucket bucket) =>
        bucket switch
        {
            Bucket.Late => new[] { "Jazz", "Ambient", "Classical", "Documentary" },
            Bucket.Morning => new[] { "News", "Education", "Kids", "Comedy" },
            Bucket.Afternoon => new[] { "Sport", "Talk", "News", "Comedy" },
            Bucket.Evening => new[] { "Documentary", "Drama", "Film", "Movie", "Action" },
            _ => Array.Empty<string>(),
        };

    /// <summary>Returns true if <paramref name="genre"/> matches any preferred substring.</summary>
    public static bool GenreMatchesBucket(string? genre, Bucket bucket)
    {
        if (string.IsNullOrWhiteSpace(genre))
        {
            return false;
        }

        foreach (var sub in PreferredGenreSubstrings(bucket))
        {
            if (genre.Contains(sub, StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }
        }

        return false;
    }
}
