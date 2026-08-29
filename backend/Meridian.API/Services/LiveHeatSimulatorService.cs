using Meridian.API.Hubs;
using Meridian.Core.Entities;
using Meridian.Core.Interfaces.Repositories;
using Microsoft.AspNetCore.SignalR;
using Meridian.Application.DTOs.Responses;
using AutoMapper;

namespace Meridian.API.Services;

public class LiveHeatSimulatorService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly IHubContext<HeatHub> _hubContext;
    private readonly ILogger<LiveHeatSimulatorService> _logger;
    private readonly Random _random = new();

    public LiveHeatSimulatorService(
        IServiceProvider serviceProvider,
        IHubContext<HeatHub> hubContext,
        ILogger<LiveHeatSimulatorService> logger)
    {
        _serviceProvider = serviceProvider;
        _hubContext = hubContext;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Live Heat Simulator Service is starting.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await SimulateHeatFluctuationAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred during heat simulation.");
            }

            // Fluctuate a random location every 2.5 seconds to make the UI look very alive
            await Task.Delay(2500, stoppingToken);
        }
    }

    private async Task SimulateHeatFluctuationAsync(CancellationToken cancellationToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var locationRepo = scope.ServiceProvider.GetRequiredService<ILocationRepository>();
        var heatRepo = scope.ServiceProvider.GetRequiredService<IHeatReadingRepository>();
        var mapper = scope.ServiceProvider.GetRequiredService<IMapper>();

        // Get all active locations
        var locations = await locationRepo.GetActiveLocationsAsync(cancellationToken);
        if (!locations.Any()) return;

        // Pick a random location to fluctuate
        var targetLocation = locations.ElementAt(_random.Next(locations.Count()));

        // Get its latest reading
        var latestReadings = await heatRepo.GetByLocationIdAsync(targetLocation.Id, 1, cancellationToken);
        var last = latestReadings.FirstOrDefault();

        double baseTemp = last?.TemperatureCelsius ?? 30.0;
        double baseHumid = last?.HumidityPercent ?? 40.0;

        // Fluctuate temp by -1.5 to +1.5 degrees
        double newTemp = Math.Round(baseTemp + (_random.NextDouble() * 3.0 - 1.5), 1);
        
        // Keep realistic bounds
        if (newTemp < -10) newTemp = -10;
        if (newTemp > 55) newTemp = 55;

        double newHumid = Math.Round(baseHumid + (_random.NextDouble() * 4.0 - 2.0), 0);
        if (newHumid < 5) newHumid = 5;
        if (newHumid > 100) newHumid = 100;

        var reading = new HeatReading
        {
            LocationId = targetLocation.Id,
            TemperatureCelsius = newTemp,
            HumidityPercent = newHumid,
            HeatIndexCelsius = newTemp + (_random.NextDouble() * 2), // simplified
            RiskLevel = Meridian.Core.Common.RiskLevelExtensions.FromTemperature(newTemp),
            MeasuredAt = DateTime.UtcNow
        };

        // Save to DB
        await heatRepo.AddAsync(reading, cancellationToken);
        await heatRepo.SaveChangesAsync(cancellationToken);

        reading.Location = targetLocation;
        var responseDto = mapper.Map<HeatReadingResponse>(reading);

        // Push to UI via SignalR
        await _hubContext.Clients.All.SendAsync("ReceiveHeatReading", responseDto, cancellationToken);
    }
}
