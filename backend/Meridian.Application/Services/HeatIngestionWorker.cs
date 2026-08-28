using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.DependencyInjection;
using Meridian.Core.Interfaces.Repositories;
using Meridian.Core.Interfaces.Services;
using Meridian.Core.Entities;
using Meridian.Core.Common;

namespace Meridian.Application.Services;

public class HeatIngestionWorker : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<HeatIngestionWorker> _logger;
    private readonly TimeSpan _pollingInterval = TimeSpan.FromMinutes(15);

    public HeatIngestionWorker(IServiceProvider serviceProvider, ILogger<HeatIngestionWorker> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("HeatIngestionWorker started.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await DoWorkAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred executing HeatIngestionWorker.");
            }

            await Task.Delay(_pollingInterval, stoppingToken);
        }

        _logger.LogInformation("HeatIngestionWorker stopping.");
    }

    private async Task DoWorkAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("HeatIngestionWorker starting a new ingestion cycle.");

        using var scope = _serviceProvider.CreateScope();
        var locationRepo = scope.ServiceProvider.GetRequiredService<ILocationRepository>();
        var heatRepo = scope.ServiceProvider.GetRequiredService<IHeatReadingRepository>();
        var tempService = scope.ServiceProvider.GetRequiredService<ITemperatureService>();

        var activeLocations = (await locationRepo.GetActiveLocationsAsync(stoppingToken)).ToList();
        if (!activeLocations.Any())
        {
            _logger.LogInformation("No active locations found to ingest.");
            return;
        }

        var locData = activeLocations.Select(l => (l.Name, l.Latitude, l.Longitude)).ToList();
        
        // Fetch temperatures concurrently
        var temperatures = await tempService.GetMultiLocationDataAsync(locData, stoppingToken);

        var readingsToInsert = new List<HeatReading>();

        foreach (var loc in activeLocations)
        {
            var temp = temperatures.FirstOrDefault(t => t.Location == loc.Name);
            if (temp != null)
            {
                var risk = RiskLevelExtensions.FromTemperature(temp.TemperatureCelsius);
                readingsToInsert.Add(new HeatReading
                {
                    LocationId = loc.Id,
                    TemperatureCelsius = temp.TemperatureCelsius,
                    HumidityPercent = temp.Humidity,
                    HeatIndexCelsius = temp.HeatIndex,
                    RiskLevel = risk,
                    MeasuredAt = temp.MeasuredAt
                });
            }
        }

        if (readingsToInsert.Any())
        {
            foreach(var reading in readingsToInsert)
            {
                await heatRepo.AddAsync(reading, stoppingToken);
            }
            await heatRepo.SaveChangesAsync(stoppingToken);
            _logger.LogInformation("Successfully ingested heat data for {Count} locations.", readingsToInsert.Count);

            // Notify connected SignalR clients
            var notificationService = scope.ServiceProvider.GetRequiredService<IHeatNotificationService>();
            await notificationService.NotifyHeatReadingsUpdatedAsync(stoppingToken);
        }
    }
}
