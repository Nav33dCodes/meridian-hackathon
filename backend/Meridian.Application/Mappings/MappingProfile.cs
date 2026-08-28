using AutoMapper;
using Meridian.Application.DTOs.Responses;
using Meridian.Core.Common;
using Meridian.Core.Entities;

namespace Meridian.Application.Mappings;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        CreateMap<HeatReading, HeatReadingResponse>()
            .ConstructUsing(s => new HeatReadingResponse(
                s.Id, s.LocationId, s.Location != null ? s.Location.Name : string.Empty,
                s.TemperatureCelsius, s.TemperatureFahrenheit, s.HumidityPercent,
                s.HeatIndexCelsius, s.RiskLevel, s.RiskLevel.ToColor(), s.Resolution,
                s.Location != null ? s.Location.Latitude : 0, s.Location != null ? s.Location.Longitude : 0,
                s.MeasuredAt));

        CreateMap<Location, LocationResponse>()
            .ConstructUsing(s => new LocationResponse(
                s.Id, s.Name, s.City, s.Country, s.Latitude, s.Longitude, s.IsActive, null));

        CreateMap<Report, ReportResponse>()
            .ConstructUsing(s => new ReportResponse(
                s.Id, s.Title, s.Content, s.LocationName,
                s.OverallRisk.ToString(), s.AverageTemperatureCelsius, s.PeakTemperatureCelsius,
                s.GeneratedBy, s.ModelUsed, s.CreatedAt));
    }
}
