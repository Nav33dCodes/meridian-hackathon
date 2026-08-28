namespace Meridian.Application.DTOs.Requests;

public record AnalyzeHeatRequest(
    string Location,
    bool SaveToDatabase = true
);

public record GenerateReportRequest(
    string? LocationName,
    DateTime? From,
    DateTime? To,
    string ReportType = "Instant"
);

public record CreateLocationRequest(
    string Name,
    string City,
    string Country,
    double Latitude,
    double Longitude,
    string? Description
);

public record AgentQueryRequest(
    string Query,
    string? Location,
    bool Stream = true
);
