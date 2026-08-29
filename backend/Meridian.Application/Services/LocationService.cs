using AutoMapper;
using Meridian.Application.DTOs.Requests;
using Meridian.Application.DTOs.Responses;
using Meridian.Core.Entities;
using Meridian.Core.Interfaces.Repositories;
using Meridian.Core.Interfaces.Services;
using Meridian.Core.Common;
using Microsoft.Extensions.DependencyInjection;

namespace Meridian.Application.Services;

public class LocationService
{
    private readonly ILocationRepository _locationRepo;
    private readonly IHeatReadingRepository _heatRepo;
    private readonly ITemperatureService _temperatureService;
    private readonly IMapper _mapper;
    private readonly IServiceProvider _serviceProvider;

    public LocationService(
        ILocationRepository locationRepo,
        IHeatReadingRepository heatRepo,
        ITemperatureService temperatureService,
        IMapper mapper,
        IServiceProvider serviceProvider)
    {
        _locationRepo = locationRepo;
        _heatRepo = heatRepo;
        _temperatureService = temperatureService;
        _mapper = mapper;
        _serviceProvider = serviceProvider;
    }

    public async Task<(IEnumerable<LocationResponse> Items, int TotalCount)> GetPaginatedWithLatestReadingsAsync(int page, int pageSize, string? search, CancellationToken ct = default)
    {
        var (locations, totalCount) = await _locationRepo.GetPaginatedLocationsAsync(page, pageSize, search, ct);
        var result = new List<LocationResponse>();

        var locationIds = locations.Select(l => l.Id).ToList();
        var latestReadings = await _heatRepo.GetLatestForLocationsAsync(locationIds, ct);
        var readingsDict = latestReadings.ToDictionary(r => r.LocationId);

        foreach (var location in locations)
        {
            readingsDict.TryGetValue(location.Id, out var latest);
            var latestDto = latest is not null ? _mapper.Map<HeatReadingResponse>(latest) : null;
            var dto = _mapper.Map<LocationResponse>(location) with { LatestReading = latestDto };
            result.Add(dto);
        }

        return (result, totalCount);
    }
    
    public async Task<IEnumerable<LocationResponse>> GetAllWithLatestReadingsAsync(CancellationToken ct = default)
    {
        var locations = await _locationRepo.GetActiveLocationsAsync(ct);
        var result = new List<LocationResponse>();

        var locationIds = locations.Select(l => l.Id).ToList();
        var latestReadings = await _heatRepo.GetLatestForLocationsAsync(locationIds, ct);
        var readingsDict = latestReadings.ToDictionary(r => r.LocationId);

        foreach (var location in locations)
        {
            readingsDict.TryGetValue(location.Id, out var latest);
            var latestDto = latest is not null ? _mapper.Map<HeatReadingResponse>(latest) : null;
            var dto = _mapper.Map<LocationResponse>(location) with { LatestReading = latestDto };
            result.Add(dto);
        }

        return result;
    }

    public async Task<LocationResponse> CreateLocationAsync(CreateLocationRequest request, CancellationToken ct = default)
    {
        var location = new Location
        {
            Name = request.Name,
            City = request.City,
            Country = request.Country,
            Latitude = request.Latitude,
            Longitude = request.Longitude,
            Description = request.Description
        };

        await _locationRepo.AddAsync(location, ct);
        await _locationRepo.SaveChangesAsync(ct);

        return _mapper.Map<LocationResponse>(location);
    }

    public async Task<IEnumerable<LocationResponse>> CreateBulkLocationsAsync(IEnumerable<CreateLocationRequest> requests, CancellationToken ct = default)
    {
        var existingLocations = await _locationRepo.GetAllAsync(ct);
        var existingNames = existingLocations.Select(l => l.Name).ToHashSet(StringComparer.OrdinalIgnoreCase);

        var locations = new List<Location>();
        foreach (var request in requests)
        {
            if (existingNames.Contains(request.Name)) continue; // Skip duplicates
            
            locations.Add(new Location
            {
                Name = request.Name,
                City = request.City,
                Country = request.Country,
                Latitude = request.Latitude,
                Longitude = request.Longitude,
                Description = request.Description
            });
            existingNames.Add(request.Name); // Prevent duplicates within the same batch
        }

        foreach (var location in locations)
        {
            await _locationRepo.AddAsync(location, ct);
        }
        
        await _locationRepo.SaveChangesAsync(ct);

        // Instantly trigger background fetch so frontend SignalR updates immediately
        _ = Task.Run(async () =>
        {
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var tempService = scope.ServiceProvider.GetRequiredService<ITemperatureService>();
                var heatRepo = scope.ServiceProvider.GetRequiredService<IHeatReadingRepository>();
                var notificationService = scope.ServiceProvider.GetRequiredService<IHeatNotificationService>();

                var locData = locations.Select(l => (l.Name, l.Latitude, l.Longitude)).ToList();
                var temperatures = await tempService.GetMultiLocationDataAsync(locData, CancellationToken.None);

                var readings = new List<HeatReading>();
                foreach (var loc in locations)
                {
                    var temp = temperatures.FirstOrDefault(t => t.Location == loc.Name);
                    if (temp != null)
                    {
                        readings.Add(new HeatReading
                        {
                            LocationId = loc.Id,
                            TemperatureCelsius = temp.TemperatureCelsius,
                            HumidityPercent = temp.Humidity,
                            HeatIndexCelsius = temp.HeatIndex,
                            RiskLevel = RiskLevelExtensions.FromTemperature(temp.TemperatureCelsius),
                            MeasuredAt = temp.MeasuredAt
                        });
                    }
                }

                if (readings.Any())
                {
                    foreach (var reading in readings) await heatRepo.AddAsync(reading, CancellationToken.None);
                    await heatRepo.SaveChangesAsync(CancellationToken.None);
                    await notificationService.NotifyHeatReadingsUpdatedAsync(CancellationToken.None);
                }
            }
            catch { /* Ignore background exceptions */ }
        });

        return locations.Select(l => _mapper.Map<LocationResponse>(l));
    }

    public async Task<bool> DeleteLocationAsync(Guid id, CancellationToken ct = default)
    {
        var location = await _locationRepo.GetByIdAsync(id, ct);
        if (location == null) return false;

        // EF Core will cascade delete heat readings automatically, 
        // or we could use ExecuteDeleteAsync on readings here for safety.
        await _locationRepo.DeleteAsync(location, ct);
        await _locationRepo.SaveChangesAsync(ct);
        return true;
    }

    public async Task DeleteAllLocationsAsync(CancellationToken ct = default)
    {
        // Instantly truncate tables using EF Core 7+ ExecuteDeleteAsync
        await _heatRepo.DeleteAllAsync(ct);
        await _locationRepo.DeleteAllAsync(ct);
    }
}
