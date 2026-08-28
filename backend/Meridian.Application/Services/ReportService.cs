using AutoMapper;
using Meridian.Application.DTOs.Requests;
using Meridian.Application.DTOs.Responses;
using Meridian.Core.Common;
using Meridian.Core.Entities;
using Meridian.Core.Interfaces.Repositories;
using Meridian.Core.Interfaces.Services;

namespace Meridian.Application.Services;

public class ReportService
{
    private readonly IReportRepository _reportRepo;
    private readonly IHeatReadingRepository _heatRepo;
    private readonly IAgentService _agentService;
    private readonly IMapper _mapper;

    public ReportService(
        IReportRepository reportRepo,
        IHeatReadingRepository heatRepo,
        IAgentService agentService,
        IMapper mapper)
    {
        _reportRepo = reportRepo;
        _heatRepo = heatRepo;
        _agentService = agentService;
        _mapper = mapper;
    }

    public async Task<ReportResponse> GenerateReportAsync(GenerateReportRequest request, CancellationToken ct = default)
    {
        var from = request.From ?? DateTime.UtcNow.AddHours(-24);
        var to = request.To ?? DateTime.UtcNow;

        var readings = (await _heatRepo.GetByDateRangeAsync(from, to, ct)).ToList();
        var extremeReadings = readings.Where(r => r.RiskLevel >= RiskLevel.High).ToList();

        var context = $"""
            Heat Analysis Report Request
            Location: {request.LocationName ?? "All Monitored Zones"}
            Period: {from:yyyy-MM-dd HH:mm} to {to:yyyy-MM-dd HH:mm} UTC
            Total Readings: {readings.Count}
            Average Temperature: {(readings.Any() ? readings.Average(r => r.TemperatureCelsius):0):F1}°C
            Peak Temperature: {(readings.Any() ? readings.Max(r => r.TemperatureCelsius):0):F1}°C
            High/Extreme Risk Events: {extremeReadings.Count}
            Affected Locations: {string.Join(", ", extremeReadings.Select(r => r.Location?.Name ?? "Unknown").Distinct().Take(5))}
            """;

        var content = await _agentService.GenerateReportAsync(context, ct);
        var avgTemp = readings.Any() ? readings.Average(r => r.TemperatureCelsius) : 0;
        var peakTemp = readings.Any() ? readings.Max(r => r.TemperatureCelsius) : 0;
        var overallRisk = RiskLevelExtensions.FromTemperature(peakTemp);

        var report = new Report
        {
            Title = $"Heat Risk Advisory — {request.LocationName ?? "Global"} — {DateTime.UtcNow:MMM dd, yyyy}",
            Content = content,
            LocationName = request.LocationName,
            OverallRisk = overallRisk,
            AverageTemperatureCelsius = avgTemp,
            PeakTemperatureCelsius = peakTemp,
            Type = Enum.Parse<ReportType>(request.ReportType, true),
            PeriodStart = from,
            PeriodEnd = to
        };

        await _reportRepo.AddAsync(report, ct);
        await _reportRepo.SaveChangesAsync(ct);

        return _mapper.Map<ReportResponse>(report);
    }

    public async Task<IEnumerable<ReportResponse>> GetRecentReportsAsync(int count = 10, CancellationToken ct = default)
    {
        var reports = await _reportRepo.GetRecentReportsAsync(count, ct);
        return _mapper.Map<IEnumerable<ReportResponse>>(reports);
    }

    public async Task<bool> DeleteReportAsync(Guid id, CancellationToken ct = default)
    {
        var report = await _reportRepo.GetByIdAsync(id, ct);
        if (report == null) return false;
        await _reportRepo.DeleteAsync(report, ct);
        await _reportRepo.SaveChangesAsync(ct);
        return true;
    }
}
