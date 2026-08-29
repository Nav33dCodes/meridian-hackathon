using ClosedXML.Excel;

namespace Meridian.API.Exports.Excel;

public interface IZoneExcelExporter
{
    byte[] ExportToExcel(IEnumerable<ZoneExportRow> zones);
}

public class ZoneExcelExporter : IZoneExcelExporter
{
    public byte[] ExportToExcel(IEnumerable<ZoneExportRow> zones)
    {
        using var workbook = new XLWorkbook();
        var worksheet = workbook.Worksheets.Add("Meridian Zones");

        // 1. Create Headers
        var headers = new[]
        {
            "Location Name", "Country", "Temperature (°C)", "Heat Index (°C)", "Humidity (%)", "Risk Level", "Measured At"
        };

        for (int i = 0; i < headers.Length; i++)
        {
            var cell = worksheet.Cell(1, i + 1);
            cell.Value = headers[i];
            
            // Style the header
            cell.Style.Font.Bold = true;
            cell.Style.Font.FontColor = XLColor.White;
            cell.Style.Fill.BackgroundColor = XLColor.FromHtml("#0F172A"); // Meridian primary dark
            cell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
        }

        // 2. Populate Data
        int row = 2;
        foreach (var zone in zones)
        {
            worksheet.Cell(row, 1).Value = zone.Location;
            worksheet.Cell(row, 2).Value = zone.Country;
            worksheet.Cell(row, 3).Value = zone.TemperatureCelsius;
            worksheet.Cell(row, 4).Value = zone.HeatIndex;
            worksheet.Cell(row, 5).Value = zone.Humidity;
            worksheet.Cell(row, 6).Value = zone.RiskLevel.ToString();
            worksheet.Cell(row, 7).Value = zone.Date;

            // Format numbers
            worksheet.Cell(row, 3).Style.NumberFormat.Format = "0.0";
            worksheet.Cell(row, 4).Style.NumberFormat.Format = "0.0";
            worksheet.Cell(row, 5).Style.NumberFormat.Format = "0.0";

            // Risk Level Color Formatting
            var riskCell = worksheet.Cell(row, 6);
            riskCell.Style.Font.Bold = true;
            riskCell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            
            switch (zone.RiskLevel.ToString())
            {
                case "Low":
                    riskCell.Style.Font.FontColor = XLColor.FromHtml("#10B981");
                    riskCell.Style.Fill.BackgroundColor = XLColor.FromHtml("#D1FAE5");
                    break;
                case "Moderate":
                    riskCell.Style.Font.FontColor = XLColor.FromHtml("#F59E0B");
                    riskCell.Style.Fill.BackgroundColor = XLColor.FromHtml("#FEF3C7");
                    break;
                case "High":
                    riskCell.Style.Font.FontColor = XLColor.FromHtml("#EF4444");
                    riskCell.Style.Fill.BackgroundColor = XLColor.FromHtml("#FEE2E2");
                    break;
                case "Extreme":
                    riskCell.Style.Font.FontColor = XLColor.FromHtml("#991B1B");
                    riskCell.Style.Fill.BackgroundColor = XLColor.FromHtml("#FEE2E2");
                    break;
            }

            row++;
        }

        // 3. Apply Auto-Filters and Auto-Fit Columns
        var range = worksheet.Range(1, 1, row - 1, headers.Length);
        range.SetAutoFilter();
        worksheet.Columns().AdjustToContents();

        // 4. Return as byte array
        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }
}
