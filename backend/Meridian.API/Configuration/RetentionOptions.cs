namespace Meridian.API.Configuration;

/// <summary>
/// Controls <see cref="Services.DataRetentionService"/>, which trims raw heat
/// readings so the table cannot grow without bound.
/// </summary>
public class RetentionOptions
{
    public const string SectionName = "Retention";

    public bool Enabled { get; set; } = true;

    /// <summary>Raw readings older than this are eligible for deletion. Floor of 1 day.</summary>
    public int RawReadingDays { get; set; } = 7;

    /// <summary>How often the sweep runs. Floor of 1 hour.</summary>
    public int SweepIntervalHours { get; set; } = 6;

    /// <summary>
    /// Rows deleted per statement. Batching keeps the first sweep — which may face
    /// hundreds of thousands of accumulated rows — off a single long transaction.
    /// </summary>
    public int BatchSize { get; set; } = 5_000;

    public TimeSpan RetentionPeriod => TimeSpan.FromDays(Math.Max(1, RawReadingDays));
    public TimeSpan SweepInterval => TimeSpan.FromHours(Math.Max(1, SweepIntervalHours));
}
