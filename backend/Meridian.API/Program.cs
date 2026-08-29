using Meridian.API.Middleware;
using Meridian.Application;
using Meridian.Infrastructure;
using Meridian.Infrastructure.Data;
using Meridian.API.Hubs;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.RateLimiting;
using System.Threading.RateLimiting;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// Serilog
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .WriteTo.Console(outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj}{NewLine}{Exception}")
    .CreateLogger();

builder.Host.UseSerilog();

// Services
builder.Services.AddControllers();
builder.Services.AddMemoryCache();
builder.Services.AddSignalR();
builder.Services.AddScoped<Meridian.Core.Interfaces.Services.IHeatNotificationService, Meridian.API.Services.HeatNotificationService>();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "Meridian API", Version = "v1", Description = "Urban Heat Intelligence API — Powered by FortyGuard + Groq AI" });
});

builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

// CORS — allow frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("MeridianCors", policy =>
        policy.WithOrigins(
            "http://localhost:3001", "http://localhost:3000",
            "https://meridian.vercel.app"
        )
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

// Migrate DB on startup
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.MigrateAsync();
    Log.Information("Database migrated successfully");
}

// Middleware pipeline
app.UseMiddleware<GlobalExceptionMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "Meridian API v1"));
}

app.UseCors("MeridianCors");
app.UseRateLimiter();
app.UseHttpsRedirection();
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
