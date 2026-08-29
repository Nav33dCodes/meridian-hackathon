using Microsoft.AspNetCore.Mvc;
using Meridian.API.Exports;
using Meridian.API.Exports.Csv;
using Meridian.API.Exports.Pdf;
using Meridian.Core.Interfaces.Repositories;
using QuestPDF.Fluent;
using Meridian.Core.Common;

namespace Meridian.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ExportController : ControllerBase
{
    private readonly ILocationRepository _locationRepo;
    private readonly IHeatReadingRepository _heatRepo;
    private readonly IZoneCsvExporter _csvExporter;
    private readonly IChartRenderer _chartRenderer;

    public ExportController(
        ILocationRepository locationRepo, 
        IHeatReadingRepository heatRepo,
        IZoneCsvExporter csvExporter,
        IChartRenderer chartRenderer)
    {
        _locationRepo = locationRepo;
        _heatRepo = heatRepo;
        _csvExporter = csvExporter;
        _chartRenderer = chartRenderer;
    }

    private async Task<ReportExportModel> BuildExportModelAsync(CancellationToken ct)
    {
        var locations = await _locationRepo.GetActiveLocationsAsync(ct);
        var exportZones = new List<ZoneExportRow>();

        double sumTemp = 0;
        int highRiskCount = 0;

        foreach (var loc in locations)
        {
            var readings = await _heatRepo.GetByLocationIdAsync(loc.Id, 1, ct);
            var last = readings.FirstOrDefault();

            if (last != null)
            {
                var risk = RiskLevelExtensions.FromTemperature(last.TemperatureCelsius);
                var riskStr = risk.ToString();
                
                exportZones.Add(new ZoneExportRow
                {
                    Location = loc.Name,
                    Country = loc.Country,
                    TemperatureCelsius = last.TemperatureCelsius,
                    HeatIndex = last.HeatIndexCelsius,
                    Humidity = last.HumidityPercent,
                    RiskLevel = riskStr,
                    Date = last.MeasuredAt.ToString("yyyy-MM-dd HH:mm:ss")
                });

                sumTemp += last.TemperatureCelsius;
                if (risk == RiskLevel.High || risk == RiskLevel.Extreme)
                {
                    highRiskCount++;
                }
            }
        }

        return new ReportExportModel
        {
            Zones = exportZones.OrderByDescending(z => z.TemperatureCelsius).ToList(),
            GlobalAverageTemp = exportZones.Any() ? sumTemp / exportZones.Count : 0,
            HighRiskCount = highRiskCount
        };
    }

    [HttpGet("csv")]
    public async Task<IActionResult> ExportCsv(CancellationToken ct)
    {
        var model = await BuildExportModelAsync(ct);
        var bytes = _csvExporter.ExportToCsv(model.Zones);
        var fileName = $"meridian-zones-{DateTime.UtcNow:yyyy-MM-dd-HHmmss}.csv";
        return File(bytes, "text/csv", fileName);
    }

    [HttpGet("pdf")]
    public async Task<IActionResult> ExportPdf(CancellationToken ct)
    {
        var model = await BuildExportModelAsync(ct);
        
        var document = new HeatReportDocument(model, _chartRenderer);
        var bytes = document.GeneratePdf();
        
        var fileName = $"meridian-report-{DateTime.UtcNow:yyyy-MM-dd}.pdf";
        return File(bytes, "application/pdf", fileName);
    }
}
