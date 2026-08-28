using Microsoft.EntityFrameworkCore;
using Meridian.Core.Entities;
using Meridian.Core.Interfaces.Repositories;
using Meridian.Infrastructure.Data;

namespace Meridian.Infrastructure.Repositories;

public class LocationRepository : Repository<Location>, ILocationRepository
{
    public LocationRepository(AppDbContext context) : base(context) { }

    public async Task<IEnumerable<Location>> GetActiveLocationsAsync(CancellationToken ct = default) =>
        await _dbSet.Where(l => l.IsActive).ToListAsync(ct);

    public async Task<Location?> GetByNameAsync(string name, CancellationToken ct = default) =>
        await _dbSet.FirstOrDefaultAsync(l => l.Name == name, ct);

    public async Task<(IEnumerable<Location> Items, int TotalCount)> GetPaginatedLocationsAsync(int page, int pageSize, string? search, CancellationToken ct = default)
    {
        var query = _dbSet.Where(l => l.IsActive);
        
        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchLower = search.ToLower();
            query = query.Where(l => l.Name.ToLower().Contains(searchLower) || l.City.ToLower().Contains(searchLower) || l.Country.ToLower().Contains(searchLower));
        }

        var totalCount = await query.CountAsync(ct);
        
        var items = await query
            .OrderBy(l => l.Name)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        return (items, totalCount);
    }
}
