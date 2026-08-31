using Meridian.API.Configuration;
using Meridian.Core.Interfaces.Repositories;
using Microsoft.Extensions.Options;

namespace Meridian.API.Services;

/// <summary>
/// Trims raw heat readings on a schedule. Without this the table grows forever:
/// the 15-minute ingestion worker and — when enabled — the live simulator both
/// append to it, and nothing ever removed a row.
/// </summary>
public class DataRetentionService : BackgroundService
{
    private readonly IServiceProvider _services;
    private readonly RetentionOptions _options;
    private readonly ILogger<DataRetentionService> _logger;

    public DataRetentionService(
        IServiceProvider services,
        IOptions<RetentionOptions> options,
        ILogger<DataRetentionService> logger)
    {
        _services = services;
        _options = options.Value;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation(
            "Data retention active: raw readings older than {Days}d are trimmed every {Hours}h",
            _options.RetentionPeriod.TotalDays,
            _options.SweepInterval.TotalHours);

        // Let startup settle before the first sweep, which is the expensive one if
        // a large backlog has already accumulated.
        try { await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken); }
        catch (OperationCanceledException) { return; }

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await SweepAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                return;
            }
            catch (Exception ex)
            {
                // Retention is housekeeping — a failed sweep must never stop the host.
                _logger.LogError(ex, "Retention sweep failed; retrying next interval");
            }

            try { await Task.Delay(_options.SweepInterval, stoppingToken); }
            catch (OperationCanceledException) { return; }
        }
    }

    private async Task SweepAsync(CancellationToken ct)
    {
        var cutoff = DateTime.UtcNow - _options.RetentionPeriod;
        var startedAt = DateTime.UtcNow;
        var total = 0;

        // Batched so the first sweep against a large backlog never becomes one
        // long-running transaction against the database.
        while (!ct.IsCancellationRequested)
        {
            using var scope = _services.CreateScope();
            var repo = scope.ServiceProvider.GetRequiredService<IHeatReadingRepository>();

            var deleted = await repo.DeleteOlderThanAsync(cutoff, _options.BatchSize, ct);
            if (deleted == 0) break;

            total += deleted;

            // Yield between batches so the sweep does not monopolise the connection.
            await Task.Delay(TimeSpan.FromSeconds(1), ct);
        }

        if (total > 0)
        {
            _logger.LogInformation(
                "Retention sweep removed {Count} readings older than {Cutoff:u} in {Elapsed:F1}s",
                total, cutoff, (DateTime.UtcNow - startedAt).TotalSeconds);
        }
        else
        {
            _logger.LogDebug("Retention sweep found nothing older than {Cutoff:u}", cutoff);
        }
    }
}
