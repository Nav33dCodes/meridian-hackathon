using Meridian.Core.Common;

namespace Meridian.Application.DTOs.Responses;

public record HeatReadingResponse(
    Guid Id,
    Guid LocationId,
    string LocationName,
    double TemperatureCelsius,
    double TemperatureFahrenheit,
    double HumidityPercent,
    double HeatIndexCelsius,
    RiskLevel RiskLevel,
    string RiskColor,
    string Resolution,
    double Latitude,
    double Longitude,
    DateTime MeasuredAt
);

public record LocationResponse(
    Guid Id,
    string Name,
    string City,
    string Country,
    double Latitude,
    double Longitude,
    bool IsActive,
    HeatReadingResponse? LatestReading
);

public record HeatAnalysisResponse(
    Guid LocationId,
    string LocationName,
    double CurrentTemp,
    double AverageTemp,
    double PeakTemp,
    string RiskLevel,
    string RiskColor,
    string AiInsight,
    IEnumerable<TrendPointResponse> TrendPoints,
    DateTime AnalyzedAt
);

public record TrendPointResponse(DateTime Timestamp, double Temperature);

public record CorrelationResponse(
    string LocationA,
    string LocationB,
    double Coefficient,
    string Interpretation
);

public record ReportResponse(
    Guid Id,
    string Title,
    string Content,
    string? LocationName,
    string OverallRisk,
    double AverageTemperatureCelsius,
    double PeakTemperatureCelsius,
    string GeneratedBy,
    string? ModelUsed,
    DateTime CreatedAt
);

public record AgentStreamChunk(
    string Text,
    bool IsDone,
    string? Error = null
);

public record DashboardSummaryResponse(
    int TotalLocations,
    int ExtremeRiskCount,
    int HighRiskCount,
    double GlobalAverageTemp,
    IEnumerable<HeatReadingResponse> LatestReadings,
    DateTime GeneratedAt
);
