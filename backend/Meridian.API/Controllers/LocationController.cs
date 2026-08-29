using Microsoft.AspNetCore.Mvc;
using Meridian.Application.DTOs.Requests;
using Meridian.Application.DTOs.Responses;
using Meridian.Application.Services;
using Microsoft.Extensions.Caching.Memory;

namespace Meridian.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class LocationController : ControllerBase
{
    private readonly LocationService _locationService;
    private readonly IMemoryCache _cache;

    public LocationController(LocationService locationService, IMemoryCache cache)
    {
        _locationService = locationService;
        _cache = cache;
    }

    /// <summary>Get all active locations with latest readings</summary>
    [HttpGet]
    public async Task<ActionResult<object>> GetAll(
        [FromQuery] int page = 1, 
        [FromQuery] int limit = 50, 
        [FromQuery] string? search = null, 
        CancellationToken ct = default)
    {
        var cacheKey = $"locations_{page}_{limit}_{search}";
        if (_cache.TryGetValue(cacheKey, out object? cachedResult) && cachedResult != null)
        {
            return Ok(cachedResult);
        }

        var (items, totalCount) = await _locationService.GetPaginatedWithLatestReadingsAsync(page, limit, search, ct);
        
        var responseObj = new 
        {
            Data = items,
            TotalCount = totalCount,
            Page = page,
            PageSize = limit,
            TotalPages = (int)Math.Ceiling(totalCount / (double)limit)
        };

        _cache.Set(cacheKey, responseObj, TimeSpan.FromSeconds(15));
        return Ok(responseObj);
    }

    /// <summary>Create a new monitored location</summary>
    [HttpPost]
    public async Task<ActionResult<LocationResponse>> Create([FromBody] CreateLocationRequest request, CancellationToken ct)
    {
        var location = await _locationService.CreateLocationAsync(request, ct);
        return CreatedAtAction(nameof(GetAll), location);
    }

    /// <summary>Create multiple locations (Bulk Import)</summary>
    [HttpPost("bulk")]
    public async Task<ActionResult<IEnumerable<LocationResponse>>> CreateBulk([FromBody] IEnumerable<CreateLocationRequest> requests, CancellationToken ct)
    {
        var locations = await _locationService.CreateBulkLocationsAsync(requests, ct);
        return Ok(locations);
    }

    /// <summary>Delete a single location and its readings</summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var success = await _locationService.DeleteLocationAsync(id, ct);
        if (!success) return NotFound();
        return NoContent();
    }

    /// <summary>Delete ALL locations and their readings</summary>
    [HttpDelete("all")]
    public async Task<IActionResult> DeleteAll(CancellationToken ct)
    {
        await _locationService.DeleteAllLocationsAsync(ct);
        return NoContent();
    }
}

