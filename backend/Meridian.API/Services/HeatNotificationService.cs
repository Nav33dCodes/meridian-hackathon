using Meridian.API.Hubs;
using Meridian.Core.Interfaces.Services;
using Microsoft.AspNetCore.SignalR;
using System.Threading;
using System.Threading.Tasks;

namespace Meridian.API.Services;

public class HeatNotificationService : IHeatNotificationService
{
    private readonly IHubContext<HeatHub> _hubContext;

    public HeatNotificationService(IHubContext<HeatHub> hubContext)
    {
        _hubContext = hubContext;
    }

    public async Task NotifyHeatReadingsUpdatedAsync(CancellationToken ct = default)
    {
        await _hubContext.Clients.All.SendAsync("HeatReadingsUpdated", ct);
    }
}
