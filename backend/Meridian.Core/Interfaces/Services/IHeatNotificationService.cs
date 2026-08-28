using System.Threading.Tasks;

namespace Meridian.Core.Interfaces.Services;

public interface IHeatNotificationService
{
    Task NotifyHeatReadingsUpdatedAsync(System.Threading.CancellationToken ct = default);
}
