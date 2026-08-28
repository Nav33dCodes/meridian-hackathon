using Meridian.Core.Common;

namespace Meridian.Core.Entities;

public class HeatReading : BaseEntity
{
    public Guid LocationId { get; set; }
    public Location Location { get; set; } = null!;

    public double TemperatureCelsius { get; set; }
    public double TemperatureFahrenheit => TemperatureCelsius * 9 / 5 + 32;
    public double HumidityPercent { get; set; }
    public double HeatIndexCelsius { get; set; }
    public RiskLevel RiskLevel { get; set; }
    public string Resolution { get; set; } = "20m²";
    public double MeasurementHeightMeters { get; set; } = 2.0;
    public DateTime MeasuredAt { get; set; } = DateTime.UtcNow;
    public string? Source { get; set; } = "FortyGuard";
}
