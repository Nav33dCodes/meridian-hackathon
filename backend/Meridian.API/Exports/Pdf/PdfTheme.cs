namespace Meridian.API.Exports.Pdf;

public static class PdfTheme
{
    public const string PrimaryColor = "#0f172a"; // slate-900
    public const string SecondaryColor = "#64748b"; // slate-500
    public const string AccentColor = "#3b82f6"; // blue-500
    public const string DangerColor = "#ef4444"; // red-500
    public const string WarningColor = "#f59e0b"; // amber-500
    public const string SuccessColor = "#10b981"; // emerald-500

    public const string BackgroundColor = "#ffffff";
    public const string TableHeaderBackground = "#f8fafc";
    public const string TableBorder = "#e2e8f0";

    public static string GetRiskColor(string riskLevel) => riskLevel?.ToLower() switch
    {
        "extreme" => DangerColor,
        "high" => WarningColor,
        "moderate" => AccentColor,
        "low" => SuccessColor,
        _ => SecondaryColor
    };
}
