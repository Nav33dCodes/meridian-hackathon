namespace Meridian.Core.Interfaces.Services;

public interface IAgentService
{
    Task<string> AnalyzeHeatDataAsync(string location, string temperatureData, CancellationToken ct = default);
    IAsyncEnumerable<string> StreamAnalysisAsync(string prompt, CancellationToken ct = default);
    Task<string> GenerateReportAsync(string analysisContext, CancellationToken ct = default);
}
