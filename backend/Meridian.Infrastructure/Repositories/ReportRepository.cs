using Microsoft.EntityFrameworkCore;
using Meridian.Core.Entities;
using Meridian.Core.Interfaces.Repositories;
using Meridian.Infrastructure.Data;

namespace Meridian.Infrastructure.Repositories;

public class ReportRepository : Repository<Report>, IReportRepository
{
    public ReportRepository(AppDbContext context) : base(context) { }

    public async Task<IEnumerable<Report>> GetRecentReportsAsync(int count = 10, CancellationToken ct = default) =>
        await _dbSet.OrderByDescending(r => r.CreatedAt).Take(count).ToListAsync(ct);

    public async Task<IEnumerable<Report>> GetByTypeAsync(ReportType type, CancellationToken ct = default) =>
        await _dbSet.Where(r => r.Type == type).OrderByDescending(r => r.CreatedAt).ToListAsync(ct);
}
