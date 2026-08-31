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
        var ids = locationIds as IReadOnlyList<Guid> ?? locationIds.ToList();
        if (ids.Count == 0) return [];

        // Hand-written because the LINQ equivalent (SelectMany over a correlated
        // Take) compiles to a ROW_NUMBER() over the *entire* table with the
        // location filter applied afterwards in a join — bounded transfer, but a
        // full scan on every call. LATERAL + LIMIT instead walks
        // IX_HeatReadings_LocationId_MeasuredAt and stops after `limit` rows per
        // location, so cost tracks (locations x limit) rather than table size.
        const string sql = """
            SELECT t.*
            FROM "Locations" AS l
            JOIN LATERAL (
                SELECT h.*
                FROM "HeatReadings" AS h
                WHERE h."LocationId" = l."Id"
                ORDER BY h."MeasuredAt" DESC
                LIMIT {0}
            ) AS t ON TRUE
            WHERE l."Id" = ANY({1})
            """;

        var rows = await _dbSet
            .FromSqlRaw(sql, limit, ids.ToArray())
            .AsNoTracking()
            .Select(r => new { r.LocationId, r.TemperatureCelsius })
            .ToListAsync(ct);

        // Rows arrive newest-first within each partition, which the grouping preserves.
        return rows.GroupBy(r => r.LocationId)
                   .ToDictionary(g => g.Key, g => g.Select(x => x.TemperatureCelsius).ToList());
    }

    public async Task<int> DeleteOlderThanAsync(DateTime cutoff, int batchSize, CancellationToken ct = default)
    {
        // A location's most recent reading is never deleted, however old it is —
        // otherwise a quiet ingestion window would empty the dashboard.
        var expired = _dbSet.Where(r => r.MeasuredAt < cutoff
            && _dbSet.Any(n => n.LocationId == r.LocationId && n.MeasuredAt > r.MeasuredAt));

        var ids = await expired
            .OrderBy(r => r.MeasuredAt)
            .Select(r => r.Id)
            .Take(batchSize)
            .ToListAsync(ct);

        if (ids.Count == 0) return 0;

        return await _dbSet.Where(r => ids.Contains(r.Id)).ExecuteDeleteAsync(ct);
    }

    public async Task DeleteAllAsync(CancellationToken ct = default)
    {
        await _dbSet.ExecuteDeleteAsync(ct);
    }
}
