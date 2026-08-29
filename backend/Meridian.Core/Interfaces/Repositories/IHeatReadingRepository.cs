using Meridian.Core.Common;
using Meridian.Core.Entities;

namespace Meridian.Core.Interfaces.Repositories;

public interface IHeatReadingRepository : IRepository<HeatReading>
{
    Task<IEnumerable<HeatReading>> GetByLocationIdAsync(Guid locationId, int limit = 100, CancellationToken ct = default);
    Task<IEnumerable<HeatReading>> GetByDateRangeAsync(DateTime from, DateTime to, CancellationToken ct = default);
    Task<HeatReading?> GetLatestByLocationAsync(Guid locationId, CancellationToken ct = default);
    Task<double> GetAverageTemperatureAsync(Guid locationId, DateTime from, DateTime to, CancellationToken ct = default);
    Task<IEnumerable<HeatReading>> GetExtremeReadingsAsync(RiskLevel minRisk, CancellationToken ct = default);
    Task<IEnumerable<HeatReading>> GetLatestForLocationsAsync(IEnumerable<Guid> locationIds, CancellationToken ct = default);
}
