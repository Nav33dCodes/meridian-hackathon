using Meridian.Application.DTOs.Responses;

namespace Meridian.API.Exports;

public class ZoneExportRow
{
    public string Location { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public double TemperatureCelsius { get; set; }
    public double HeatIndex { get; set; }
    public double Humidity { get; set; }
    public string RiskLevel { get; set; } = string.Empty;
    public string Date { get; set; } = string.Empty;
}

public class ReportExportModel
{
    public string Title { get; set; } = "Meridian Heat Intelligence Report";
    public string Date { get; set; } = DateTime.UtcNow.ToString("MMMM dd, yyyy");
    public string Description { get; set; } = string.Empty;
    public List<ZoneExportRow> Zones { get; set; } = new();
    public double GlobalAverageTemp { get; set; }
    public int HighRiskCount { get; set; }
}
