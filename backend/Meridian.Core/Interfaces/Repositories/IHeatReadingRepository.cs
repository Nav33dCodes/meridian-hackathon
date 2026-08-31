using Meridian.Core.Common;
using Meridian.Core.Entities;

namespace Meridian.Core.Interfaces.Repositories;

public interface IHeatReadingRepository : IRepository<HeatReading>
{
    Task<IEnumerable<HeatReading>> GetByLocationIdAsync(Guid locationId, int limit = 100, CancellationToken ct = default);
    /// <summary>Most recent readings across all locations, limited in SQL.</summary>
    Task<IEnumerable<HeatReading>> GetRecentAsync(int limit = 100, CancellationToken ct = default);

    /// <summary>
    /// Readings between <paramref name="from"/> and <paramref name="to"/>, downsampled to the
    /// newest reading per location per <paramref name="bucket"/>. Result size is bounded by
    /// (locations x buckets) rather than by how many raw rows fall in the window.
    /// </summary>
    Task<IEnumerable<HeatReading>> GetBucketedHistoryAsync(DateTime from, DateTime to, TimeSpan bucket, int maxRows = 10_000, CancellationToken ct = default);

    /// <summary>Aggregate statistics for a window, computed in SQL rather than over materialised rows.</summary>
    Task<HeatRangeSummary> GetRangeSummaryAsync(DateTime from, DateTime to, CancellationToken ct = default);
    Task<IEnumerable<double>> GetTemperaturesByLocationAsync(Guid locationId, int limit = 50, CancellationToken ct = default);
    Task<HeatReading?> GetLatestByLocationAsync(Guid locationId, CancellationToken ct = default);
    Task<double> GetAverageTemperatureAsync(Guid locationId, DateTime from, DateTime to, CancellationToken ct = default);
    Task<IEnumerable<HeatReading>> GetExtremeReadingsAsync(RiskLevel minRisk, CancellationToken ct = default);
    Task<IEnumerable<HeatReading>> GetLatestForLocationsAsync(IEnumerable<Guid> locationIds, CancellationToken ct = default);
    Task<Dictionary<Guid, List<double>>> GetTemperaturesForLocationsAsync(IEnumerable<Guid> locationIds, int limit = 50, CancellationToken ct = default);
    Task DeleteAllAsync(CancellationToken ct = default);

    /// <summary>
    /// Deletes up to <paramref name="batchSize"/> readings older than <paramref name="cutoff"/>,
    /// always preserving each location's most recent reading. Returns the number deleted;
    /// call repeatedly until it returns 0.
    /// </summary>
    Task<int> DeleteOlderThanAsync(DateTime cutoff, int batchSize, CancellationToken ct = default);
}
