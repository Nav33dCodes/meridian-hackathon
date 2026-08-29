using CsvHelper;
using CsvHelper.Configuration;
using System.Globalization;

namespace Meridian.API.Exports.Csv;

public class ZoneExportMap : ClassMap<ZoneExportRow>
{
    public ZoneExportMap()
    {
        Map(m => m.Location).Name("Location Name");
        Map(m => m.Country).Name("Country");
        Map(m => m.TemperatureCelsius).Name("Temperature (°C)").TypeConverterOption.Format("0.0");
        Map(m => m.HeatIndex).Name("Heat Index (°C)").TypeConverterOption.Format("0.0");
        Map(m => m.Humidity).Name("Humidity (%)").TypeConverterOption.Format("0.0");
        Map(m => m.RiskLevel).Name("Risk Level");
        Map(m => m.Date).Name("Measured At");
    }
}

public interface IZoneCsvExporter
{
    byte[] ExportToCsv(IEnumerable<ZoneExportRow> zones);
}

public class ZoneCsvExporter : IZoneCsvExporter
{
    public byte[] ExportToCsv(IEnumerable<ZoneExportRow> zones)
    {
        using var memoryStream = new MemoryStream();
        
        // Add UTF-8 BOM so Excel opens it with the correct encoding (needed for the degree ° symbol)
        byte[] preamble = System.Text.Encoding.UTF8.GetPreamble();
        memoryStream.Write(preamble, 0, preamble.Length);

        using var writer = new StreamWriter(memoryStream, new System.Text.UTF8Encoding(true));
        using var csv = new CsvWriter(writer, CultureInfo.InvariantCulture);

        csv.Context.RegisterClassMap<ZoneExportMap>();
        csv.WriteRecords(zones);
        
        writer.Flush();
        return memoryStream.ToArray();
    }
}
