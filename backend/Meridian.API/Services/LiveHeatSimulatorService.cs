using Meridian.API.Hubs;
using Meridian.Core.Entities;
using Meridian.Core.Interfaces.Repositories;
using Microsoft.AspNetCore.SignalR;
using Meridian.Application.DTOs.Responses;
using Meridian.API.Configuration;
using Microsoft.Extensions.Options;
using AutoMapper;

namespace Meridian.API.Services;

/// <summary>
/// Writes synthetic readings so the live dashboard keeps moving during demos.
/// This is not real telemetry, and it appends to the same table as the FortyGuard
/// ingestion worker — set <c>Simulator__Enabled=false</c> to switch it off.
/// </summary>
public class LiveHeatSimulatorService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly IHubContext<HeatHub> _hubContext;
    private readonly SimulatorOptions _options;
    private readonly ILogger<LiveHeatSimulatorService> _logger;
    private readonly Random _random = new();

    public LiveHeatSimulatorService(
        IServiceProvider serviceProvider,
        IHubContext<HeatHub> hubContext,
        IOptions<SimulatorOptions> options,
        ILogger<LiveHeatSimulatorService> logger)
    {
        _serviceProvider = serviceProvider;
        _hubContext = hubContext;
        _options = options.Value;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogWarning(
            "Live Heat Simulator ENABLED — writing synthetic readings every {Interval}s. "
            + "Set Simulator__Enabled=false to disable.",
            _options.Interval.TotalSeconds);

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

            // Fluctuate a random location on an interval to keep the UI visibly live.
            try { await Task.Delay(_options.Interval, stoppingToken); }
            catch (OperationCanceledException) { return; }
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
