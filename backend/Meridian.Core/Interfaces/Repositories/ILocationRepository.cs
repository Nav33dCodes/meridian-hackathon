using Meridian.Core.Entities;

namespace Meridian.Core.Interfaces.Repositories;

public interface ILocationRepository : IRepository<Location>
{
    Task<IEnumerable<Location>> GetActiveLocationsAsync(CancellationToken ct = default);
    Task<Location?> GetByNameAsync(string name, CancellationToken ct = default);
    Task<(IEnumerable<Location> Items, int TotalCount)> GetPaginatedLocationsAsync(int page, int pageSize, string? search, CancellationToken ct = default);
    Task DeleteAllAsync(CancellationToken ct = default);
}
