using Meridian.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Meridian.API.Startup;

/// <summary>
/// Applies EF migrations at startup with bounded retries.
/// </summary>
/// <remarks>
/// An unguarded MigrateAsync() turns any transient database blip into a restart
/// loop: the exception is unhandled, the process exits, the platform restarts it,
/// and it fails again. This retries with backoff so a brief outage is survivable,
/// and fails fast with a readable message when the connection string was never
/// configured — which is otherwise a DNS error buried deep in a stack trace.
/// </remarks>
public static class DatabaseInitializer
{
    private const int MaxAttempts = 5;

    private static readonly string[] PlaceholderMarkers =
    [
        "your-neon-host",
        "YOUR_NEON_PASSWORD"
    ];

    public static async Task MigrateAsync(WebApplication app)
    {
        var logger = app.Services.GetRequiredService<ILoggerFactory>()
            .CreateLogger(typeof(DatabaseInitializer));

        var connectionString = app.Configuration.GetConnectionString("DefaultConnection") ?? string.Empty;

        if (string.IsNullOrWhiteSpace(connectionString) ||
            PlaceholderMarkers.Any(m => connectionString.Contains(m, StringComparison.OrdinalIgnoreCase)))
        {
            throw new InvalidOperationException(
                "ConnectionStrings:DefaultConnection is missing or still set to the placeholder value from "
                + "appsettings.json. Set a real connection string — locally in appsettings.Development.json, "
                + "or in the host as the ConnectionStrings__DefaultConnection environment variable.");
        }

        for (var attempt = 1; ; attempt++)
        {
            try
            {
                using var scope = app.Services.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                await db.Database.MigrateAsync();

                logger.LogInformation("Database migrated successfully (attempt {Attempt})", attempt);
                return;
            }
            catch (Exception ex) when (attempt < MaxAttempts)
            {
                // 2s, 4s, 8s, 16s — enough to ride out a Neon cold start or a
                // short network interruption without hammering the database.
                var delay = TimeSpan.FromSeconds(Math.Pow(2, attempt));

                logger.LogWarning(ex,
                    "Database migration failed (attempt {Attempt}/{Max}); retrying in {Delay}s",
                    attempt, MaxAttempts, delay.TotalSeconds);

                await Task.Delay(delay);
            }
        }
    }
}
