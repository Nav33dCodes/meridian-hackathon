namespace Meridian.Core.Common;

public enum RiskLevel
{
    Low = 0,
    Moderate = 1,
    High = 2,
    Extreme = 3
}

public static class RiskLevelExtensions
{
    public static RiskLevel FromTemperature(double tempCelsius) => tempCelsius switch
    {
        < 30 => RiskLevel.Low,
        < 38 => RiskLevel.Moderate,
        < 44 => RiskLevel.High,
        _ => RiskLevel.Extreme
    };

    public static string ToColor(this RiskLevel level) => level switch
    {
        RiskLevel.Low => "#22c55e",
        RiskLevel.Moderate => "#f59e0b",
        RiskLevel.High => "#ef4444",
        RiskLevel.Extreme => "#7c2d12",
        _ => "#6b7280"
    };
}
