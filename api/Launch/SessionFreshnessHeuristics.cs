using OrangeTv.Api.Data.Entities;

namespace OrangeTv.Api.Launch;

public static class SessionFreshnessHeuristics
{
    public static SessionFreshness FromExit(int exitCode, TimeSpan sessionDuration)
    {
        if (exitCode != 0)
        {
            return SessionFreshness.ResetSuggested;
        }

        if (sessionDuration < ChromeProfilePaths.ShortSessionThreshold)
        {
            return SessionFreshness.PossiblyStale;
        }

        return SessionFreshness.LikelyActive;
    }
}
