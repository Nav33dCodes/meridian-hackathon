using AutoMapper;
using Microsoft.Extensions.DependencyInjection;
using Meridian.Application.Mappings;
using Meridian.Application.Services;
using Meridian.Core.Interfaces.Services;

namespace Meridian.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddAutoMapper(cfg => cfg.AddMaps(typeof(MappingProfile).Assembly));
        services.AddScoped<IHeatAnalysisService, HeatAnalysisService>();
        services.AddScoped<ReportService>();
        services.AddScoped<LocationService>();
        services.AddHostedService<HeatIngestionWorker>();
        return services;
    }
}
