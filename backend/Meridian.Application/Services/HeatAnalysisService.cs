using AutoMapper;
using Meridian.Application.DTOs.Responses;
using Meridian.Core.Common;
using Meridian.Core.Entities;
using Meridian.Core.Interfaces.Repositories;
using Meridian.Core.Interfaces.Services;

namespace Meridian.Application.Services;

public class HeatAnalysisService : IHeatAnalysisService
{
    private readonly IHeatReadingRepository _heatRepo;
    private readonly ILocationRepository _locationRepo;
    private readonly IAgentService _agentService;
    private readonly IMapper _mapper;

    public HeatAnalysisService(
        IHeatReadingRepository heatRepo,
        ILocationRepository locationRepo,
        IAgentService agentService,
        IMapper mapper)
    {
        _heatRepo = heatRepo;
        _locationRepo = locationRepo;
        _agentService = agentService;
        _mapper = mapper;
    }

    public async Task<HeatAnalysisResult> AnalyzeLocationAsync(Guid locationId, CancellationToken ct = default)
    {
        var location = await _locationRepo.GetByIdAsync(locationId, ct)
            ?? throw new KeyNotFoundException($"Location {locationId} not found");

        var from = DateTime.UtcNow.AddHours(-24);
        var readings = await _heatRepo.GetByLocationIdAsync(locationId, 100, ct);
        var readingsList = readings.ToList();

        var current = readingsList.OrderByDescending(r => r.MeasuredAt).FirstOrDefault();
        var avgTemp = readingsList.Any() ? readingsList.Average(r => r.TemperatureCelsius) : 0;
        var peakTemp = readingsList.Any() ? readingsList.Max(r => r.TemperatureCelsius) : 0;
        var riskLevel = current?.RiskLevel ?? RiskLevel.Low;

        var context = $"Location: {location.Name}, City: {location.City}. " +
                      $"Current: {current?.TemperatureCelsius:F1}°C. " +
                      $"24h Average: {avgTemp:F1}°C. Peak: {peakTemp:F1}°C. " +
                      $"Risk: {riskLevel}. Readings count: {readingsList.Count}";

        var insight = await _agentService.AnalyzeHeatDataAsync(location.Name, context, ct);

        return new HeatAnalysisResult(
            locationId,
            location.Name,
            current?.TemperatureCelsius ?? 0,
            avgTemp,
            peakTemp,
            riskLevel,
            insight,
            DateTime.UtcNow
        );
    }

    public async Task<IEnumerable<HeatCorrelation>> GetCorrelationsAsync(DateTime from, DateTime to, CancellationToken ct = default)
    {
        var locations = await _locationRepo.GetActiveLocationsAsync(ct);
        var locationList = locations.ToList();
        var correlations = new List<HeatCorrelation>();

        var readingsDict = new Dictionary<Guid, List<double>>();
        foreach (var loc in locationList)
        {
            readingsDict[loc.Id] = (await _heatRepo.GetTemperaturesByLocationAsync(loc.Id, 50, ct)).ToList();
        }

        for (int i = 0; i < locationList.Count; i++)
        {
            for (int j = i + 1; j < locationList.Count; j++)
            {
                var readingsA = readingsDict[locationList[i].Id];
                var readingsB = readingsDict[locationList[j].Id];

                if (readingsA.Count < 2 || readingsB.Count < 2) continue;

                var coefficient = CalculatePearsonCorrelation(
                    readingsA,
                    readingsB
                );

                var interpretation = coefficient switch
                {
                    > 0.8 => "Strong positive correlation — heat patterns move together",
                    > 0.5 => "Moderate correlation — similar heat behavior",
                    > 0 => "Weak positive correlation",
                    > -0.5 => "Weak negative correlation",
                    _ => "Strong negative correlation — inverse heat patterns"
                };

                correlations.Add(new HeatCorrelation(
                    locationList[i].Name,
                    locationList[j].Name,
                    Math.Round(coefficient, 3),
                    interpretation
                ));
            }
        }

        return correlations;
    }

    public async Task<HeatTrend> GetTrendAsync(Guid locationId, int hoursBack = 24, CancellationToken ct = default)
    {
        var readings = (await _heatRepo.GetByLocationIdAsync(locationId, 200, ct))
            .OrderBy(r => r.MeasuredAt)
            .TakeLast(hoursBack)
            .ToList();

        if (readings.Count < 2)
            return new HeatTrend(locationId, "stable", 0, []);

        var first = readings.First().TemperatureCelsius;
        var last = readings.Last().TemperatureCelsius;
        var changeRate = last - first;

        var trend = changeRate switch
        {
            > 5 => "spike",
            > 1 => "rising",
            < -1 => "falling",
            _ => "stable"
        };

        return new HeatTrend(
            locationId,
            trend,
            Math.Round(changeRate, 2),
            readings.Select(r => new TrendPoint(r.MeasuredAt, r.TemperatureCelsius))
        );
    }

    private static double CalculatePearsonCorrelation(List<double> x, List<double> y)
    {
        int n = Math.Min(x.Count, y.Count);
        if (n < 2) return 0;

        double meanX = x.Take(n).Average();
        double meanY = y.Take(n).Average();

        double numerator = x.Take(n).Zip(y.Take(n), (xi, yi) => (xi - meanX) * (yi - meanY)).Sum();
        double denomX = Math.Sqrt(x.Take(n).Sum(xi => Math.Pow(xi - meanX, 2)));
        double denomY = Math.Sqrt(y.Take(n).Sum(yi => Math.Pow(yi - meanY, 2)));

        return denomX == 0 || denomY == 0 ? 0 : numerator / (denomX * denomY);
    }
}
