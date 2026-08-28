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
}
