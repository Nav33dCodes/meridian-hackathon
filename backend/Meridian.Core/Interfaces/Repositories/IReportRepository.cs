using Meridian.Core.Entities;

namespace Meridian.Core.Interfaces.Repositories;

public interface IReportRepository : IRepository<Report>
{
    Task<IEnumerable<Report>> GetRecentReportsAsync(int count = 10, CancellationToken ct = default);
    Task<IEnumerable<Report>> GetByTypeAsync(ReportType type, CancellationToken ct = default);
}
