using ScottPlot;

namespace Meridian.API.Exports.Pdf;

public interface IChartRenderer
{
    byte[] GenerateTemperatureTrendChart(IReadOnlyList<ZoneExportRow> zones);
}

public class ChartRenderer : IChartRenderer
{
    // Rendering dominates PDF generation time, so keep the raster modest and
    // let QuestPDF scale it to the page rather than rendering oversized.
    private const int Width = 900;
    private const int Height = 320;
    private const int TopN = 10;

    public byte[] GenerateTemperatureTrendChart(IReadOnlyList<ZoneExportRow> zones)
    {
        // Callers pass an already temperature-sorted list; just take the head.
        var top = zones.Count > TopN ? zones.Take(TopN).ToList() : zones.ToList();

        var plot = new Plot();
        plot.FigureBackground.Color = Color.FromHex("#FFFFFF");
        plot.DataBackground.Color = Color.FromHex("#FFFFFF");

        var bars = top.Select((z, i) => new Bar
        {
            Position = i,
            Value = z.TemperatureCelsius,
            FillColor = Color.FromHex(PdfTheme.GetRiskColor(z.RiskLevel).TrimStart('#')),
            LineColor = Color.FromHex("#FFFFFF"),
            LineWidth = 0,
        }).ToList();

        plot.Add.Bars(bars);

        var ticks = new Tick[top.Count];
        for (var i = 0; i < top.Count; i++)
        {
            var label = top[i].Location;
            if (label.Length > 14) label = string.Concat(label.AsSpan(0, 13), "…");
            ticks[i] = new Tick(i, label);
        }

        plot.Axes.Bottom.TickGenerator = new ScottPlot.TickGenerators.NumericManual(ticks);
        plot.Axes.Bottom.TickLabelStyle.Rotation = -35;
        plot.Axes.Bottom.TickLabelStyle.Alignment = Alignment.MiddleRight;
        plot.Axes.Bottom.TickLabelStyle.FontSize = 11;
        plot.Axes.Left.TickLabelStyle.FontSize = 11;

        plot.Axes.Left.Label.Text = "Temperature (°C)";
        plot.Axes.Left.Label.FontSize = 12;

        plot.Grid.MajorLineColor = Color.FromHex("E2E8F0");
        plot.Grid.XAxisStyle.IsVisible = false;
        plot.HideLegend();

        // Bars read better against a floor slightly below the coolest value.
        if (top.Count > 0)
        {
            var min = top.Min(z => z.TemperatureCelsius);
            var max = top.Max(z => z.TemperatureCelsius);
            plot.Axes.SetLimitsY(Math.Max(0, min - 4), max + 3);
        }

        plot.Axes.AutoScaleX();
        return plot.GetImageBytes(Width, Height, ImageFormat.Png);
    }
}
