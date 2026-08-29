using Microsoft.AspNetCore.Mvc;
using Meridian.Application.DTOs.Requests;
using Meridian.Application.DTOs.Responses;
using Meridian.Core.Common;
using Meridian.Core.Interfaces.Services;
using Microsoft.Extensions.Caching.Memory;

namespace Meridian.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class AnalysisController : ControllerBase
{
    private readonly IHeatAnalysisService _analysisService;
    private readonly IMemoryCache _cache;

    public AnalysisController(IHeatAnalysisService analysisService, IMemoryCache cache)
    {
        _analysisService = analysisService;
        _cache = cache;
    }

    /// <summary>Full AI-powered heat analysis for a location</summary>
    [HttpGet("location/{locationId}")]
    public async Task<ActionResult<HeatAnalysisResponse>> AnalyzeLocation(Guid locationId, CancellationToken ct)
    {
        var cacheKey = $"analysis_{locationId}";
        if (_cache.TryGetValue(cacheKey, out HeatAnalysisResponse? cachedResult) && cachedResult != null)
        {
            return Ok(cachedResult);
        }

        var result = await _analysisService.AnalyzeLocationAsync(locationId, ct);
        var responseObj = new HeatAnalysisResponse(
            result.LocationId,
            result.LocationName,
            result.CurrentTemp,
            result.AverageTemp,
            result.PeakTemp,
            result.RiskLevel.ToString(),
            result.RiskLevel.ToColor(),
            result.AiInsight,
            [],
            result.AnalyzedAt
        );

        _cache.Set(cacheKey, responseObj, TimeSpan.FromMinutes(5));
        return Ok(responseObj);
    }

    /// <summary>Get Pearson correlation between all monitored locations</summary>
    [HttpGet("correlations")]
    public async Task<ActionResult<IEnumerable<CorrelationResponse>>> GetCorrelations(
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        CancellationToken ct = default)
    {
        var f = from ?? DateTime.UtcNow.AddDays(-7);
        var t = to ?? DateTime.UtcNow;
        var cacheKey = $"correlations_{f:yyyyMMdd}_{t:yyyyMMdd}";

        if (_cache.TryGetValue(cacheKey, out IEnumerable<CorrelationResponse>? cachedResult) && cachedResult != null)
        {
            return Ok(cachedResult);
        }

        var correlations = await _analysisService.GetCorrelationsAsync(f, t, ct);
        var responseObj = correlations.Select(c => new CorrelationResponse(c.LocationA, c.LocationB, c.CorrelationCoefficient, c.Interpretation)).ToList();
        
        _cache.Set(cacheKey, responseObj, TimeSpan.FromSeconds(30));
        return Ok(responseObj);
    }

    /// <summary>Get heat trend for a location</summary>
    [HttpGet("trend/{locationId}")]
    public async Task<ActionResult<object>> GetTrend(Guid locationId, [FromQuery] int hoursBack = 24, CancellationToken ct = default)
    {
        var trend = await _analysisService.GetTrendAsync(locationId, hoursBack, ct);
        return Ok(new
        {
            locationId = trend.LocationId,
            direction = trend.TrendDirection,
            changeRate = trend.ChangeRate,
            dataPoints = trend.DataPoints.Select(p => new TrendPointResponse(p.Timestamp, p.Temperature))
        });
    }
}
