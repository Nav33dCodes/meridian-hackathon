namespace Meridian.Core.Common;

/// <summary>
/// Aggregate statistics for a time window, computed in SQL. Report generation
/// needs counts and extremes, not the rows themselves — materialising every
/// reading in the window just to average it does not scale with the table.
/// </summary>
public record HeatRangeSummary(
    int TotalReadings,
    double AverageTemperatureCelsius,
    double PeakTemperatureCelsius,
    int HighRiskCount,
    IReadOnlyList<string> AffectedLocations
)
{
    public static readonly HeatRangeSummary Empty = new(0, 0, 0, 0, []);
}
