using ScottPlot;

namespace Meridian.API.Exports.Pdf;

public interface IChartRenderer
{
    byte[] GenerateTemperatureTrendChart(List<ZoneExportRow> zones);
}

public class ChartRenderer : IChartRenderer
{
    public byte[] GenerateTemperatureTrendChart(List<ZoneExportRow> zones)
    {
        var topZones = zones.OrderByDescending(z => z.TemperatureCelsius).Take(10).ToList();
        
        var plot = new Plot();
        plot.FigureBackground.Color = Colors.White;
        plot.DataBackground.Color = Colors.White;

        double[] values = topZones.Select(z => z.TemperatureCelsius).ToArray();
        
        plot.Add.Bars(values);
        
        Tick[] ticks = new Tick[topZones.Count];
        for (int i = 0; i < topZones.Count; i++)
        {
            var label = topZones[i].Location;
            if (label.Length > 12) label = label.Substring(0, 12) + "..";
            ticks[i] = new Tick(i, label);
        }
        
        plot.Axes.Bottom.TickGenerator = new ScottPlot.TickGenerators.NumericManual(ticks);
        plot.Axes.Bottom.TickLabelStyle.Rotation = -45;
        
        plot.YLabel("Temperature (°C)");
        plot.Title("Top 10 Hottest Monitored Zones");

        return plot.GetImageBytes(600, 400, ImageFormat.Png);
    }
}
