using Microsoft.AspNetCore.SignalR;

namespace Meridian.API.Hubs;

public class HeatHub : Hub
{
    // The worker will push updates to all connected clients through this Hub
    // Clients don't necessarily need to send messages, just receive them.
}
