using Meridian.API.Exports.Excel;
using Meridian.API.Exports.Pdf;
using QuestPDF.Fluent;

namespace Meridian.API.Exports;

/// <summary>
/// Exercises the export stack once at startup. ClosedXML, QuestPDF and
/// ScottPlot each pay a large one-time JIT and font/assembly loading cost —
/// roughly 8s for the first workbook and 3s for the first PDF — which would
/// otherwise land on whoever clicks Export first after a deploy.
/// </summary>
public class ExportWarmupService : BackgroundService
{
    private readonly IServiceProvider _services;
    private readonly ILogger<ExportWarmupService> _logger;

    public ExportWarmupService(IServiceProvider services, ILogger<ExportWarmupService> logger)
    {
        _services = services;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // Yield first so warmup never delays the app becoming ready.
        await Task.Yield();

        try
        {
            using var scope = _services.CreateScope();
            var excel = scope.ServiceProvider.GetRequiredService<IZoneExcelExporter>();
            var charts = scope.ServiceProvider.GetRequiredService<IChartRenderer>();

            var sample = new ReportExportModel
            {
                Description = "warmup",
                GlobalAverageTemp = 30,
                HighRiskCount = 1,
                Zones =
                [
                    new ZoneExportRow
                    {
                        Location = "Warmup",
                        Country = "—",
                        TemperatureCelsius = 41,
                        HeatIndex = 43,
                        Humidity = 20,
                        RiskLevel = "High",
                        Date = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss")
                    }
                ]
            };

            var started = DateTime.UtcNow;

            _ = excel.ExportToExcel(sample);
            var chart = charts.GenerateTemperatureTrendChart(sample.Zones);
            _ = new HeatReportDocument(sample, chart).GeneratePdf();

            _logger.LogInformation(
                "Export stack warmed up in {Elapsed:F0}ms",
                (DateTime.UtcNow - started).TotalMilliseconds);
        }
        catch (Exception ex)
        {
            // Warmup is best-effort; a failure here must never affect serving.
            _logger.LogWarning(ex, "Export warmup failed; first export will be slower");
        }
    }
}
