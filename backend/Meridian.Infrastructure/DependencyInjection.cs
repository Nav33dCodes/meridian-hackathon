using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Polly.Extensions.Http;
using Microsoft.Extensions.DependencyInjection;
using Polly;
using Meridian.Core.Interfaces.Repositories;
using Meridian.Core.Interfaces.Services;
using Meridian.Infrastructure.Data;
using Meridian.Infrastructure.External.FortyGuard;
using Meridian.Infrastructure.External.Groq;
using Meridian.Infrastructure.Repositories;

namespace Meridian.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration config)
    {
        // Database
        services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(config.GetConnectionString("DefaultConnection") ?? "Host=localhost;Database=meridian;Username=postgres;Password=password"));

        // Repositories
        services.AddScoped<IHeatReadingRepository, HeatReadingRepository>();
        services.AddScoped<ILocationRepository, LocationRepository>();
        services.AddScoped<IReportRepository, ReportRepository>();

        // FortyGuard HTTP Client with Polly retry
        services.AddHttpClient<ITemperatureService, FortyGuardClient>(client =>
        {
            client.BaseAddress = new Uri(config["FortyGuard:BaseUrl"] ?? "https://api.fortyguard.com");
            client.DefaultRequestHeaders.Add("api-key", config["FortyGuard:ApiKey"] ?? "demo");
            client.Timeout = TimeSpan.FromSeconds(30);
        })
        .AddTransientHttpErrorPolicy(p => p.WaitAndRetryAsync(3, _ => TimeSpan.FromMilliseconds(500)));

        // Groq HTTP Client with Polly retry for Rate Limits (429)
        services.AddHttpClient("GroqClient", client =>
        {
            client.Timeout = TimeSpan.FromMinutes(2); // AI calls can be slow
        })
        .AddTransientHttpErrorPolicy(p => p.WaitAndRetryAsync(3, attempt => TimeSpan.FromSeconds(Math.Pow(2, attempt))));

        // Groq Agent
        services.AddTransient<IAgentService, GroqAgentService>();

        return services;
    }
}
