namespace OrangeTv.Api.Data.Entities;

/// <summary>
/// Key-value settings persisted for the local host service.
/// </summary>
public sealed class SettingEntity
{
    public string Key { get; set; } = "";

    public string? Value { get; set; }

    public DateTime UpdatedAtUtc { get; set; }
}
