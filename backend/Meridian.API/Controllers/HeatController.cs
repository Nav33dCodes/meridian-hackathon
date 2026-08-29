using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using Meridian.Application.DTOs.Requests;
using Meridian.Application.DTOs.Responses;
using Meridian.Core.Common;
using Meridian.Core.Entities;
using Meridian.Core.Interfaces.Repositories;
using Meridian.Core.Interfaces.Services;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.AspNetCore.SignalR;
using Meridian.API.Hubs;

namespace Meridian.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class HeatController : ControllerBase
{
    private readonly IHeatReadingRepository _repo;
    private readonly ITemperatureService _tempService;
    private readonly ILocationRepository _locationRepo;
    private readonly IMapper _mapper;
    private readonly ILogger<HeatController> _logger;
    private readonly IMemoryCache _cache;
    private readonly IHubContext<HeatHub> _hubContext;

    public HeatController(
        IHeatReadingRepository repo,
        ITemperatureService tempService,
        ILocationRepository locationRepo,
        IMapper mapper,
        ILogger<HeatController> logger,
        IMemoryCache cache,
        IHubContext<HeatHub> hubContext)
    {
        _repo = repo;
        _tempService = tempService;
        _locationRepo = locationRepo;
        _mapper = mapper;
        _logger = logger;
        _cache = cache;
        _hubContext = hubContext;
    }

    /// <summary>Get all heat readings (latest 100)</summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<HeatReadingResponse>>> GetAll(CancellationToken ct)
    {
        var readings = await _repo.GetAllAsync(ct);
        return Ok(_mapper.Map<IEnumerable<HeatReadingResponse>>(readings.Take(100)));
    }

    /// <summary>Get readings for a specific location</summary>
    [HttpGet("location/{locationId}")]
    public async Task<ActionResult<IEnumerable<HeatReadingResponse>>> GetByLocation(Guid locationId, [FromQuery] int limit = 50, CancellationToken ct = default)
    {
        var readings = await _repo.GetByLocationIdAsync(locationId, limit, ct);
        return Ok(_mapper.Map<IEnumerable<HeatReadingResponse>>(readings));
    }

    /// <summary>Fetch live temperature from FortyGuard and save to DB</summary>
    [HttpPost("ingest")]
    public async Task<ActionResult<HeatReadingResponse>> IngestReading([FromBody] AnalyzeHeatRequest request, CancellationToken ct)
    {
        var location = await _locationRepo.GetByNameAsync(request.Location, ct);
        if (location is null)
            return NotFound($"Location '{request.Location}' not found. Create it first.");

        var data = await _tempService.GetCurrentTemperatureAsync(request.Location, location.Latitude, location.Longitude, ct);
        if (data is null)
            return StatusCode(503, "Temperature service unavailable.");

        var reading = new HeatReading
        {
            LocationId = location.Id,
            TemperatureCelsius = data.TemperatureCelsius,
            HumidityPercent = data.Humidity,
            HeatIndexCelsius = data.HeatIndex,
            RiskLevel = RiskLevelExtensions.FromTemperature(data.TemperatureCelsius),
            MeasuredAt = data.MeasuredAt
        };

        if (request.SaveToDatabase)
        {
            await _repo.AddAsync(reading, ct);
            await _repo.SaveChangesAsync(ct);
        }

        reading.Location = location;
        var responseDto = _mapper.Map<HeatReadingResponse>(reading);

        // SignalR Real-Time Alert for Extreme Heat
        if (reading.RiskLevel == RiskLevel.Extreme)
        {
            await _hubContext.Clients.All.SendAsync("ReceiveHeatAlert", new
            {
                LocationName = location.Name,
                Temperature = reading.TemperatureCelsius,
                RiskLevel = reading.RiskLevel.ToString(),
                Timestamp = reading.MeasuredAt
            }, ct);
        }

        return Ok(responseDto);
    }

    /// <summary>Get dashboard summary</summary>
    [HttpGet("dashboard")]
    public async Task<ActionResult<DashboardSummaryResponse>> GetDashboard(CancellationToken ct)
    {
        if (_cache.TryGetValue("dashboard", out DashboardSummaryResponse? cachedResult) && cachedResult != null)
        {
            return Ok(cachedResult);
        }

        var locations = await _locationRepo.GetActiveLocationsAsync(ct);
        var locationIds = locations.Select(l => l.Id).ToList();

        var latestReadings = await _repo.GetLatestForLocationsAsync(locationIds, ct);
        
        var allReadings = new List<HeatReadingResponse>();
        int extremeCount = 0, highCount = 0;
        var temps = new List<double>();

        var locationDict = locations.ToDictionary(l => l.Id);

        foreach (var latest in latestReadings)
        {
            if (locationDict.TryGetValue(latest.LocationId, out var loc))
            {
                latest.Location = loc;
                var dto = _mapper.Map<HeatReadingResponse>(latest);
                allReadings.Add(dto);
                temps.Add(latest.TemperatureCelsius);
                
                if (latest.RiskLevel == RiskLevel.Extreme) extremeCount++;
                else if (latest.RiskLevel == RiskLevel.High) highCount++;
            }
        }

        var responseObj = new DashboardSummaryResponse(
            locations.Count(),
            extremeCount,
            highCount,
            temps.Any() ? Math.Round(temps.Average(), 1) : 0,
            allReadings.OrderByDescending(r => r.TemperatureCelsius),
            DateTime.UtcNow
        );

        _cache.Set("dashboard", responseObj, TimeSpan.FromSeconds(10));
        return Ok(responseObj);
    }

    /// <summary>Get historical readings for time-lapse slider</summary>
    [HttpGet("history")]
    public async Task<ActionResult<IEnumerable<HeatReadingResponse>>> GetHistory([FromQuery] int hours = 24, CancellationToken ct = default)
    {
        var fromDate = DateTime.UtcNow.AddHours(-hours);
        var readings = await _repo.GetByDateRangeAsync(fromDate, DateTime.UtcNow, ct);
        return Ok(_mapper.Map<IEnumerable<HeatReadingResponse>>(readings));
    }
}
