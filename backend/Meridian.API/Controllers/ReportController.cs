using Microsoft.AspNetCore.Mvc;
using Meridian.Application.DTOs.Requests;
using Meridian.Application.DTOs.Responses;
using Meridian.Application.Services;

namespace Meridian.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class ReportController : ControllerBase
{
    private readonly ReportService _reportService;

    public ReportController(ReportService reportService)
    {
        _reportService = reportService;
    }

    /// <summary>Generate an AI-powered heat risk advisory report</summary>
    [HttpPost("generate")]
    public async Task<ActionResult<ReportResponse>> GenerateReport([FromBody] GenerateReportRequest request, CancellationToken ct)
    {
        var report = await _reportService.GenerateReportAsync(request, ct);
        return Ok(report);
    }

    /// <summary>Get recent reports</summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<ReportResponse>>> GetRecent([FromQuery] int count = 10, CancellationToken ct = default)
    {
        var reports = await _reportService.GetRecentReportsAsync(count, ct);
        return Ok(reports);
    }

    /// <summary>Delete a specific report by ID</summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var success = await _reportService.DeleteReportAsync(id, ct);
        if (!success) return NotFound();
        return NoContent();
    }
}

