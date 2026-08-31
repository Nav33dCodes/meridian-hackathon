namespace Meridian.API.Configuration;

/// <summary>
/// Controls <see cref="Services.LiveHeatSimulatorService"/>. The simulator writes
/// synthetic readings to the same table as real FortyGuard ingestion, so in any
/// environment where the data matters it should be switched off via
/// <c>Simulator__Enabled=false</c> — no redeploy of the image required.
/// </summary>
public class SimulatorOptions
{
    public const string SectionName = "Simulator";

    /// <summary>Whether the simulator is registered at all. Off means zero writes.</summary>
    public bool Enabled { get; set; } = true;

    /// <summary>Seconds between simulated readings. Clamped to a 0.5s floor.</summary>
    public double IntervalSeconds { get; set; } = 2.5;

    public TimeSpan Interval => TimeSpan.FromSeconds(Math.Max(0.5, IntervalSeconds));
}
