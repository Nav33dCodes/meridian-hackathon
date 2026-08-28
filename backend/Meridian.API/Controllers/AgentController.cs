using System.Text;
using Microsoft.AspNetCore.Mvc;
using Meridian.Application.DTOs.Requests;
using Meridian.Core.Interfaces.Services;
using Meridian.Application.Services;

namespace Meridian.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AgentController : ControllerBase
{
    private readonly IAgentService _agentService;
    private readonly ILogger<AgentController> _logger;

    public AgentController(IAgentService agentService, ILogger<AgentController> logger)
    {
        _agentService = agentService;
        _logger = logger;
    }

    /// <summary>Stream AI agent analysis via Server-Sent Events</summary>
    [HttpPost("stream")]
    public async Task StreamAgent([FromBody] AgentQueryRequest request, [FromServices] LocationService locationService, CancellationToken ct)
    {
        Response.Headers.Append("Content-Type", "text/event-stream");
        Response.Headers.Append("Cache-Control", "no-cache");
        Response.Headers.Append("Connection", "keep-alive");
        Response.Headers.Append("Access-Control-Allow-Origin", "*");

        // Fetch and summarize data to prevent token overflow
        var locations = await locationService.GetAllWithLatestReadingsAsync(ct);
        var activeReadings = locations.Where(l => l.LatestReading != null).ToList();
        
        string systemContext;
        if (activeReadings.Any())
        {
            var globalAvg = activeReadings.Average(l => l.LatestReading!.TemperatureCelsius);
            var extremeCount = activeReadings.Count(l => l.LatestReading!.RiskLevel.ToString() == "Extreme");
            var hottest = activeReadings.OrderByDescending(l => l.LatestReading!.TemperatureCelsius).Take(3).Select(l => $"{l.Name} ({l.LatestReading!.TemperatureCelsius:F1}°C)").ToList();
            
            systemContext = $"[SYSTEM CONTEXT: Currently monitoring {activeReadings.Count} zones. Global Avg Temp: {globalAvg:F1}°C. {extremeCount} zones in Extreme Risk. Hottest zones: {string.Join(", ", hottest)}.]\n\n";
        }
        else
        {
            systemContext = "[SYSTEM CONTEXT: No active sensor data available.]\n\n";
        }

        var prompt = request.Location is not null
            ? $"{systemContext}Location: {request.Location}\n\nQuery: {request.Query}"
            : $"{systemContext}Query: {request.Query}";

        try
        {
            await foreach (var chunk in _agentService.StreamAnalysisAsync(prompt, ct))
            {
                var data = $"data: {System.Text.Json.JsonSerializer.Serialize(chunk)}\n\n";
                await Response.WriteAsync(data, Encoding.UTF8, ct);
                await Response.Body.FlushAsync(ct);
            }

            await Response.WriteAsync("data: [DONE]\n\n", Encoding.UTF8, ct);
        }
        catch (OperationCanceledException)
        {
            _logger.LogInformation("Stream cancelled by client");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Agent stream error");
            await Response.WriteAsync($"data: {{\"error\": \"{ex.Message}\"}}\n\n", Encoding.UTF8, ct);
        }
    }

    /// <summary>Non-streaming agent query</summary>
    [HttpPost("query")]
    public async Task<ActionResult<object>> Query([FromBody] AgentQueryRequest request, [FromServices] LocationService locationService, CancellationToken ct)
    {
        var locations = await locationService.GetAllWithLatestReadingsAsync(ct);
        var activeReadings = locations.Where(l => l.LatestReading != null).ToList();
        
        string systemContext;
        if (activeReadings.Any())
        {
            var globalAvg = activeReadings.Average(l => l.LatestReading!.TemperatureCelsius);
            var extremeCount = activeReadings.Count(l => l.LatestReading!.RiskLevel.ToString() == "Extreme");
            var hottest = activeReadings.OrderByDescending(l => l.LatestReading!.TemperatureCelsius).Take(3).Select(l => $"{l.Name} ({l.LatestReading!.TemperatureCelsius:F1}°C)").ToList();
            
            systemContext = $"[SYSTEM CONTEXT: Currently monitoring {activeReadings.Count} zones. Global Avg Temp: {globalAvg:F1}°C. {extremeCount} zones in Extreme Risk. Hottest zones: {string.Join(", ", hottest)}.]\n\n";
        }
        else
        {
            systemContext = "[SYSTEM CONTEXT: No active sensor data available.]\n\n";
        }

        var prompt = request.Location is not null
            ? $"{systemContext}Location: {request.Location}\n\nQuery: {request.Query}"
            : $"{systemContext}Query: {request.Query}";

        var response = await _agentService.AnalyzeHeatDataAsync(request.Location ?? "Global", prompt, ct);
        return Ok(new { response, timestamp = DateTime.UtcNow });
    }
}
