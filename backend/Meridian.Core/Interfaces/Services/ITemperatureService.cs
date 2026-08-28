namespace Meridian.Core.Interfaces.Services;

public interface ITemperatureService
{
    Task<TemperatureData?> GetCurrentTemperatureAsync(string location, double latitude, double longitude, CancellationToken ct = default);
    Task<IEnumerable<TemperatureData>> GetMultiLocationDataAsync(IEnumerable<(string Location, double Lat, double Lng)> locations, CancellationToken ct = default);
}

public record TemperatureData(
    string Location,
    double TemperatureFahrenheit,
    double TemperatureCelsius,
    double Humidity,
    double HeatIndex,
    string RiskLevel,
    string Resolution,
    DateTime MeasuredAt
);
