namespace Meridian.API.Exports.Pdf;

public static class PdfTheme
{
    public const string Ink = "#0F172A";
    public const string Muted = "#64748B";
    public const string Faint = "#94A3B8";
    public const string Hairline = "#E2E8F0";
    public const string Surface = "#F8FAFC";
    public const string White = "#FFFFFF";

    public const string Accent = "#EA580C";
    public const string AccentSoft = "#FDEEE3";

    // Semantic risk colours, aligned with the web app's risk palette.
    public const string RiskLow = "#16A34A";
    public const string RiskModerate = "#D97706";
    public const string RiskHigh = "#DC2626";
    public const string RiskExtreme = "#991B1B";

    public static string GetRiskColor(string? riskLevel) => riskLevel?.ToLowerInvariant() switch
    {
        "extreme" => RiskExtreme,
        "high" => RiskHigh,
        "moderate" => RiskModerate,
        "low" => RiskLow,
        _ => Muted
    };

    public static string GetRiskTint(string? riskLevel) => riskLevel?.ToLowerInvariant() switch
    {
        "extreme" => "#FEE2E2",
        "high" => "#FEE2E2",
        "moderate" => "#FEF3C7",
        "low" => "#DCFCE7",
        _ => Surface
    };
}
