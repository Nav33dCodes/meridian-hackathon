using Meridian.Core.Common;

namespace Meridian.Core.Entities;

public class Report : BaseEntity
{
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string? LocationName { get; set; }
    public RiskLevel OverallRisk { get; set; }
    public double AverageTemperatureCelsius { get; set; }
    public double PeakTemperatureCelsius { get; set; }
    public string GeneratedBy { get; set; } = "Meridian AI Agent";
    public string? ModelUsed { get; set; } = "qwen/qwen3.8-27b";
    public ReportType Type { get; set; }
    public DateTime PeriodStart { get; set; }
    public DateTime PeriodEnd { get; set; }
}

public enum ReportType
{
    Instant,
    Hourly,
    Daily,
    Weekly
}
