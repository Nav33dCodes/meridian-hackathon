using Meridian.Core.Common;

namespace Meridian.Core.Interfaces.Services;

public interface IHeatAnalysisService
{
    Task<HeatAnalysisResult> AnalyzeLocationAsync(Guid locationId, CancellationToken ct = default);
    Task<IEnumerable<HeatCorrelation>> GetCorrelationsAsync(DateTime from, DateTime to, CancellationToken ct = default);
    Task<HeatTrend> GetTrendAsync(Guid locationId, int hoursBack = 24, CancellationToken ct = default);
}

public record HeatAnalysisResult(
    Guid LocationId,
    string LocationName,
    double CurrentTemp,
    double AverageTemp,
    double PeakTemp,
    RiskLevel RiskLevel,
    string AiInsight,
    DateTime AnalyzedAt
);

public record HeatCorrelation(
    string LocationA,
    string LocationB,
    double CorrelationCoefficient,
    string Interpretation
);

public record HeatTrend(
    Guid LocationId,
    string TrendDirection,   // "rising" | "falling" | "stable" | "spike"
    double ChangeRate,
    IEnumerable<TrendPoint> DataPoints
);

public record TrendPoint(DateTime Timestamp, double Temperature);
