using Microsoft.EntityFrameworkCore;
using Meridian.Core.Common;
using Meridian.Core.Entities;
using Meridian.Core.Interfaces.Repositories;
using Meridian.Infrastructure.Data;

namespace Meridian.Infrastructure.Repositories;

public class HeatReadingRepository : Repository<HeatReading>, IHeatReadingRepository
{
    public HeatReadingRepository(AppDbContext context) : base(context) { }

    public async Task<IEnumerable<HeatReading>> GetByLocationIdAsync(Guid locationId, int limit = 100, CancellationToken ct = default) =>
        await _dbSet.Include(r => r.Location)
            .Where(r => r.LocationId == locationId)
            .OrderByDescending(r => r.MeasuredAt)
            .Take(limit)
            .ToListAsync(ct);

    public async Task<IEnumerable<double>> GetTemperaturesByLocationAsync(Guid locationId, int limit = 50, CancellationToken ct = default) =>
        await _dbSet
            .Where(r => r.LocationId == locationId)
            .OrderByDescending(r => r.MeasuredAt)
            .Select(r => r.TemperatureCelsius)
            .Take(limit)
            .ToListAsync(ct);

    public async Task<IEnumerable<HeatReading>> GetByDateRangeAsync(DateTime from, DateTime to, CancellationToken ct = default) =>
        await _dbSet.Include(r => r.Location)
            .Where(r => r.MeasuredAt >= from && r.MeasuredAt <= to)
            .OrderByDescending(r => r.MeasuredAt)
            .ToListAsync(ct);

    public async Task<HeatReading?> GetLatestByLocationAsync(Guid locationId, CancellationToken ct = default) =>
        await _dbSet.Include(r => r.Location)
            .Where(r => r.LocationId == locationId)
            .OrderByDescending(r => r.MeasuredAt)
            .FirstOrDefaultAsync(ct);

    public async Task<double> GetAverageTemperatureAsync(Guid locationId, DateTime from, DateTime to, CancellationToken ct = default) =>
        await _dbSet
            .Where(r => r.LocationId == locationId && r.MeasuredAt >= from && r.MeasuredAt <= to)
            .AverageAsync(r => (double?)r.TemperatureCelsius, ct) ?? 0;

    public async Task<IEnumerable<HeatReading>> GetExtremeReadingsAsync(RiskLevel minRisk, CancellationToken ct = default) =>
        await _dbSet.Include(r => r.Location)
            .Where(r => r.RiskLevel >= minRisk)
            .OrderByDescending(r => r.MeasuredAt)
            .Take(50)
            .ToListAsync(ct);

    public async Task<IEnumerable<HeatReading>> GetLatestForLocationsAsync(IEnumerable<Guid> locationIds, CancellationToken ct = default)
    {
        // Fetch the max MeasuredAt for each location, then join back to get the full record
        var latestReadings = await _dbSet
            .Where(r => locationIds.Contains(r.LocationId))
            .GroupBy(r => r.LocationId)
            .Select(g => g.OrderByDescending(x => x.MeasuredAt).FirstOrDefault())
            .ToListAsync(ct);

        return latestReadings.Where(r => r != null)!;
    }

    public async Task<Dictionary<Guid, List<double>>> GetTemperaturesForLocationsAsync(IEnumerable<Guid> locationIds, int limit = 50, CancellationToken ct = default)
    {
        // Batch fetch temperatures. To respect the limit per location in a single query, we fetch more and group in-memory.
        // For correlations (usually < 20 locations, 50 points), fetching 1000 rows into memory is extremely fast compared to N queries.
        var data = await _dbSet
            .Where(r => locationIds.Contains(r.LocationId))
            .OrderByDescending(r => r.MeasuredAt)
            .Select(r => new { r.LocationId, r.TemperatureCelsius })
            .ToListAsync(ct);

        return data.GroupBy(r => r.LocationId)
                   .ToDictionary(g => g.Key, g => g.Select(x => x.TemperatureCelsius).Take(limit).ToList());
    }

    public async Task DeleteAllAsync(CancellationToken ct = default)
    {
        await _dbSet.ExecuteDeleteAsync(ct);
    }
}
