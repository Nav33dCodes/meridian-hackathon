using System.Runtime.CompilerServices;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.ChatCompletion;
using Meridian.Core.Interfaces.Services;

namespace Meridian.Infrastructure.External.Groq;

public class GroqAgentService : IAgentService
{
    private readonly ILogger<GroqAgentService> _logger;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly string _apiKey;
    private readonly string _model;

    public GroqAgentService(IConfiguration config, ILogger<GroqAgentService> logger, IHttpClientFactory httpClientFactory)
    {
        _logger = logger;
        _httpClientFactory = httpClientFactory;
        _apiKey = config["Groq:ApiKey"] ?? throw new InvalidOperationException("Groq:ApiKey not configured");
        _model = config["Groq:Model"] ?? "llama3-70b-8192";
    }

    private Kernel BuildKernel()
    {
        var httpClient = _httpClientFactory.CreateClient("GroqClient");

        return Kernel.CreateBuilder()
            .AddOpenAIChatCompletion(
                modelId: _model,
                apiKey: _apiKey,
                httpClient: httpClient,
                endpoint: new Uri("https://api.groq.com/openai/v1")
            )
            .Build();
    }

    public async Task<string> AnalyzeHeatDataAsync(string location, string temperatureData, CancellationToken ct = default)
    {
        var kernel = BuildKernel();
        var chat = kernel.GetRequiredService<IChatCompletionService>();

        var history = new ChatHistory();
        history.AddSystemMessage("""
            You are Meridian, an expert urban heat intelligence AI agent.
            You analyze hyperlocal temperature data measured 2 meters above ground 
            with 20m² resolution using FortyGuard's sensor network.
            
            Provide concise, actionable heat risk analysis for city governments and 
            urban planners. Focus on:
            - Current risk assessment
            - Key risk factors 
            - Immediate recommendations
            - Population vulnerability (elderly, children, outdoor workers)
            
            Be direct and data-driven. Max 3 paragraphs.
            """);

        history.AddUserMessage($"Analyze this urban heat data and provide a risk assessment:\n\n{temperatureData}");

        try
        {
            var result = await chat.GetChatMessageContentAsync(history, cancellationToken: ct);
            return result.Content ?? "Analysis unavailable.";
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Groq analysis failed for {Location}", location);
            return $"Heat risk analysis for {location}: Data ingested. AI analysis temporarily unavailable — check raw sensor data for manual assessment.";
        }
    }

    public async IAsyncEnumerable<string> StreamAnalysisAsync(string prompt, [EnumeratorCancellation] CancellationToken ct = default)
    {
        var kernel = BuildKernel();
        var chat = kernel.GetRequiredService<IChatCompletionService>();

        var history = new ChatHistory();
        history.AddSystemMessage("""
            You are Meridian, an autonomous urban heat intelligence AI agent powered by FortyGuard's 
            hyperlocal temperature API. You help cities understand and respond to urban heat risks.
            Analyze heat data, find patterns, generate advisories, and recommend actions.
            Be precise, actionable, and cite specific temperature values when available.
            """);
        history.AddUserMessage(prompt);

        await foreach (var chunk in chat.GetStreamingChatMessageContentsAsync(history, cancellationToken: ct))
        {
            if (!string.IsNullOrEmpty(chunk.Content))
                yield return chunk.Content;
        }
    }

    public async Task<string> GenerateReportAsync(string analysisContext, CancellationToken ct = default)
    {
        var kernel = BuildKernel();
        var chat = kernel.GetRequiredService<IChatCompletionService>();

        var history = new ChatHistory();
        history.AddSystemMessage("""
            You are Meridian's report generation agent. Create professional heat risk advisory 
            reports for city governments and emergency management teams.
            
            Structure your report as:
            ## Executive Summary
            ## Current Heat Risk Assessment  
            ## Key Findings & Patterns
            ## At-Risk Populations
            ## Recommended Actions
            ## Monitoring Advisory
            
            Use clear, authoritative language suitable for government officials.
            """);

        history.AddUserMessage($"Generate a comprehensive heat risk advisory report based on:\n\n{analysisContext}");

        var result = await chat.GetChatMessageContentAsync(history, cancellationToken: ct);
        return result.Content ?? "Report generation failed.";
    }
}
