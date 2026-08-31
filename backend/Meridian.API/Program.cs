using Meridian.API.Middleware;
using Meridian.Application;
using Meridian.Infrastructure;
using Meridian.Infrastructure.Data;
using Meridian.API.Hubs;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.RateLimiting;
using System.Threading.RateLimiting;
using Serilog;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.HttpOverrides;
using Meridian.API.Exports.Pdf;
using Meridian.API.Configuration;
using Meridian.API.Startup;
using QuestPDF.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

QuestPDF.Settings.License = LicenseType.Community;

// Serilog
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .WriteTo.Console(outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj}{NewLine}{Exception}")
    .CreateLogger();

builder.Host.UseSerilog();

// Services
builder.Services.AddControllers()
    .AddJsonOptions(options => 
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });
builder.Services.AddMemoryCache();
builder.Services.AddSignalR()
    .AddJsonProtocol(options => 
    {
        options.PayloadSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });
builder.Services.AddScoped<Meridian.Core.Interfaces.Services.IHeatNotificationService, Meridian.API.Services.HeatNotificationService>();
builder.Services.AddScoped<Meridian.API.Exports.Excel.IZoneExcelExporter, Meridian.API.Exports.Excel.ZoneExcelExporter>();
builder.Services.AddScoped<IChartRenderer, ChartRenderer>();
builder.Services.AddHostedService<Meridian.API.Exports.ExportWarmupService>();

// Background writers are configuration-gated. The simulator appends synthetic
// rows to the same table as real ingestion, so it must be switchable off in any
// environment where the data matters (Simulator__Enabled=false) — and retention
// keeps that table from growing without bound either way.
builder.Services.Configure<SimulatorOptions>(
    builder.Configuration.GetSection(SimulatorOptions.SectionName));
builder.Services.Configure<RetentionOptions>(
    builder.Configuration.GetSection(RetentionOptions.SectionName));

var simulatorOptions = builder.Configuration.GetSection(SimulatorOptions.SectionName)
    .Get<SimulatorOptions>() ?? new SimulatorOptions();
var retentionOptions = builder.Configuration.GetSection(RetentionOptions.SectionName)
    .Get<RetentionOptions>() ?? new RetentionOptions();

if (simulatorOptions.Enabled)
{
    builder.Services.AddHostedService<Meridian.API.Services.LiveHeatSimulatorService>();
}

if (retentionOptions.Enabled)
{
    builder.Services.AddHostedService<Meridian.API.Services.DataRetentionService>();
}
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "Meridian API", Version = "v1", Description = "Urban Heat Intelligence API — Powered by FortyGuard + Groq AI" });
});

builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

// CORS — allow frontend. Extra origins come from configuration
// (Cors:AllowedOrigins, or the Cors__AllowedOrigins__0 env var) so the
// deployed Vercel URL can be added without a code change.
var corsOrigins = new[]
{
    "http://localhost:3000",
    "https://meridian.vercel.app"
}
.Concat(builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [])
.Distinct()
.ToArray();

builder.Services.AddCors(options =>
{
    options.AddPolicy("MeridianCors", policy =>
        policy.WithOrigins(corsOrigins)
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials()
    );
});

// Rate limiting
builder.Services.AddRateLimiter(o =>
{
    o.AddFixedWindowLimiter("api", options =>
    {
        options.PermitLimit = 60;
        options.Window = TimeSpan.FromMinutes(1);
    });
});

// Health checks
builder.Services.AddHealthChecks();

var app = builder.Build();

// Migrate DB on startup, with retries so a transient outage does not become a
// permanent restart loop.
await DatabaseInitializer.MigrateAsync(app);

if (!simulatorOptions.Enabled)
{
    Log.Information("Live heat simulator is disabled (Simulator:Enabled=false)");
}

// Middleware pipeline
app.UseMiddleware<GlobalExceptionMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "Meridian API v1"));
}

// Behind a TLS-terminating proxy (Render, Azure, etc.) the app receives plain
// HTTP, so trust the forwarded scheme/host and skip the HTTPS redirect there —
// redirecting would loop forever. Locally this is unchanged.
var behindProxy = Environment.GetEnvironmentVariable("DOTNET_RUNNING_IN_CONTAINER") == "true";

if (behindProxy)
{
    app.UseForwardedHeaders(new ForwardedHeadersOptions
    {
        ForwardedHeaders = ForwardedHeaders.XForwardedProto | ForwardedHeaders.XForwardedFor,
        KnownNetworks = { },
        KnownProxies = { }
    });
}

app.UseCors("MeridianCors");
app.UseRateLimiter();

if (!behindProxy)
{
    app.UseHttpsRedirection();
}

app.UseAuthorization();
app.MapControllers();
app.MapHealthChecks("/health");
app.MapHub<HeatHub>("/hubs/heat");

app.MapGet("/", () => new
{
    Name = "Meridian API",
    Version = "1.0.0",
    Status = "Online",
    Environment = app.Environment.EnvironmentName,
    Documentation = "/swagger/index.html"
});

Log.Information("Meridian API starting on {Env}", app.Environment.EnvironmentName);
app.Run();
