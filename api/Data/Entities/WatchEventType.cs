namespace OrangeTv.Api.Data.Entities;

/// <summary>Append-only watch / playback event kinds.</summary>
public enum WatchEventType : byte
{
    AppLaunched = 0,
    PlaybackStarted = 1,
    PlaybackProgress = 2,
    PlaybackEnded = 3,
}
