using ClosedXML.Excel;

namespace Meridian.API.Exports.Excel;

public interface IZoneExcelExporter
{
    byte[] ExportToExcel(ReportExportModel model);
}

/// <summary>
/// Builds the Meridian workbook: a summary sheet with the headline metrics and
/// risk breakdown, plus a filterable zone-level data sheet.
/// </summary>
public class ZoneExcelExporter : IZoneExcelExporter
{
    // Kept in sync with RiskLevelExtensions thresholds.
    private static readonly string[] RiskOrder = ["Extreme", "High", "Moderate", "Low"];

    private static readonly Dictionary<string, (string Text, string Fill)> RiskPalette = new()
    {
        ["Low"] = ("#065F46", "#D1FAE5"),
        ["Moderate"] = ("#92400E", "#FEF3C7"),
        ["High"] = ("#991B1B", "#FEE2E2"),
        ["Extreme"] = ("#FFFFFF", "#991B1B"),
    };

    private const string Ink = "#0F172A";
    private const string Muted = "#64748B";
    private const string Hairline = "#E2E8F0";
    private const string Accent = "#EA580C";

    public byte[] ExportToExcel(ReportExportModel model)
    {
        using var workbook = new XLWorkbook();
        workbook.Properties.Title = model.Title;
        workbook.Properties.Author = "Meridian";
        workbook.Properties.Company = "Meridian Heat Intelligence";
        workbook.Properties.Created = DateTime.UtcNow;

        BuildSummarySheet(workbook, model);
        BuildZoneSheet(workbook, model);

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }

    private static void BuildSummarySheet(XLWorkbook workbook, ReportExportModel model)
    {
        var ws = workbook.Worksheets.Add("Summary");
        ws.ShowGridLines = false;
        ws.Column(1).Width = 3;
        ws.Column(2).Width = 34;
        ws.Column(3).Width = 22;
        ws.Column(4).Width = 22;

        ws.Cell(2, 2).Value = model.Title;
        ws.Range(2, 2, 2, 4).Merge();
        ws.Cell(2, 2).Style.Font.SetBold().Font.SetFontSize(20).Font.SetFontColor(XLColor.FromHtml(Ink));

        ws.Cell(3, 2).Value = $"Generated {model.Date} UTC";
        ws.Range(3, 2, 3, 4).Merge();
        ws.Cell(3, 2).Style.Font.SetFontSize(10).Font.SetFontColor(XLColor.FromHtml(Muted));

        ws.Range(4, 2, 4, 4).Merge().Style
            .Border.SetBottomBorder(XLBorderStyleValues.Thin)
            .Border.SetBottomBorderColor(XLColor.FromHtml(Accent));

        var row = 6;
        ws.Cell(row, 2).Value = "Key metrics";
        ws.Cell(row, 2).Style.Font.SetBold().Font.SetFontSize(12);
        row += 1;

        void Metric(string label, XLCellValue value, string? numberFormat = null, string? color = null)
        {
            ws.Cell(row, 2).Value = label;
            ws.Cell(row, 2).Style.Font.SetFontColor(XLColor.FromHtml(Muted));

            var cell = ws.Cell(row, 3);
            cell.Value = value;
            cell.Style.Font.SetBold().Font.SetFontSize(12);
            if (numberFormat is not null) cell.Style.NumberFormat.Format = numberFormat;
            if (color is not null) cell.Style.Font.SetFontColor(XLColor.FromHtml(color));

            ws.Range(row, 2, row, 4).Style
                .Border.SetBottomBorder(XLBorderStyleValues.Hair)
                .Border.SetBottomBorderColor(XLColor.FromHtml(Hairline));
            row++;
        }

        Metric("Zones monitored", model.Zones.Count);
        Metric("Global average temperature", model.GlobalAverageTemp, "0.0\" °C\"");
        Metric("High or extreme risk zones", model.HighRiskCount, color: "#B91C1C");

        if (model.Zones.Count > 0)
        {
            var hottest = model.Zones[0];
            Metric("Hottest zone", $"{hottest.Location} · {hottest.TemperatureCelsius:F1} °C", color: Accent);
        }

        row += 1;
        ws.Cell(row, 2).Value = "Risk distribution";
        ws.Cell(row, 2).Style.Font.SetBold().Font.SetFontSize(12);
        row += 1;

        ws.Cell(row, 2).Value = "Risk level";
        ws.Cell(row, 3).Value = "Zones";
        ws.Cell(row, 4).Value = "Share";
        ws.Range(row, 2, row, 4).Style
            .Font.SetBold().Font.SetFontColor(XLColor.White)
            .Fill.SetBackgroundColor(XLColor.FromHtml(Ink))
            .Alignment.SetHorizontal(XLAlignmentHorizontalValues.Left);
        row++;

        var counts = model.Zones
            .GroupBy(z => z.RiskLevel)
            .ToDictionary(g => g.Key, g => g.Count(), StringComparer.OrdinalIgnoreCase);

        foreach (var level in RiskOrder)
        {
            counts.TryGetValue(level, out var count);
            ws.Cell(row, 2).Value = level;
            ws.Cell(row, 3).Value = count;
            ws.Cell(row, 4).Value = model.Zones.Count == 0 ? 0 : (double)count / model.Zones.Count;
            ws.Cell(row, 4).Style.NumberFormat.Format = "0.0%";

            if (RiskPalette.TryGetValue(level, out var palette))
            {
                ws.Cell(row, 2).Style
                    .Font.SetBold().Font.SetFontColor(XLColor.FromHtml(palette.Text))
                    .Fill.SetBackgroundColor(XLColor.FromHtml(palette.Fill));
            }
            row++;
        }

        ws.Cell(row + 1, 2).Value = "Source: FortyGuard API · 20 m² resolution · 2 m above ground level";
        ws.Cell(row + 1, 2).Style.Font.SetFontSize(9).Font.SetItalic()
            .Font.SetFontColor(XLColor.FromHtml(Muted));

        ws.SheetView.FreezeRows(4);
    }

    private static void BuildZoneSheet(XLWorkbook workbook, ReportExportModel model)
    {
        var ws = workbook.Worksheets.Add("Zone Data");
        ws.ShowGridLines = false;

        string[] headers =
        [
            "Location", "Country", "Temperature (°C)", "Heat Index (°C)",
            "Humidity (%)", "Risk Level", "Measured At (UTC)"
        ];

        for (var i = 0; i < headers.Length; i++)
        {
            var cell = ws.Cell(1, i + 1);
            cell.Value = headers[i];
            cell.Style
                .Font.SetBold().Font.SetFontColor(XLColor.White)
                .Fill.SetBackgroundColor(XLColor.FromHtml(Ink))
                .Alignment.SetVertical(XLAlignmentVerticalValues.Center)
                .Alignment.SetHorizontal(i >= 2 && i <= 5
                    ? XLAlignmentHorizontalValues.Center
                    : XLAlignmentHorizontalValues.Left);
        }
        ws.Row(1).Height = 22;

        var row = 2;
        foreach (var zone in model.Zones)
        {
            ws.Cell(row, 1).Value = zone.Location;
            ws.Cell(row, 2).Value = zone.Country;
            ws.Cell(row, 3).Value = zone.TemperatureCelsius;
            ws.Cell(row, 4).Value = zone.HeatIndex;
            ws.Cell(row, 5).Value = zone.Humidity;
            ws.Cell(row, 6).Value = zone.RiskLevel;

            // Write a real DateTime where possible so Excel can sort/filter by date
            // instead of treating the timestamp as text.
            if (DateTime.TryParse(zone.Date, out var measuredAt))
            {
                ws.Cell(row, 7).Value = measuredAt;
                ws.Cell(row, 7).Style.NumberFormat.Format = "yyyy-mm-dd hh:mm";
            }
            else
            {
                ws.Cell(row, 7).Value = zone.Date;
            }

            ws.Cell(row, 3).Style.NumberFormat.Format = "0.0";
            ws.Cell(row, 4).Style.NumberFormat.Format = "0.0";
            ws.Cell(row, 5).Style.NumberFormat.Format = "0.0";
            ws.Range(row, 3, row, 6).Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center);

            var riskCell = ws.Cell(row, 6);
            if (RiskPalette.TryGetValue(zone.RiskLevel, out var palette))
            {
                riskCell.Style
                    .Font.SetBold().Font.SetFontColor(XLColor.FromHtml(palette.Text))
                    .Fill.SetBackgroundColor(XLColor.FromHtml(palette.Fill));
            }

            if (row % 2 == 1)
            {
                ws.Range(row, 1, row, 5).Style.Fill.SetBackgroundColor(XLColor.FromHtml("#F8FAFC"));
                ws.Cell(row, 7).Style.Fill.SetBackgroundColor(XLColor.FromHtml("#F8FAFC"));
            }

            ws.Range(row, 1, row, headers.Length).Style
                .Border.SetBottomBorder(XLBorderStyleValues.Hair)
                .Border.SetBottomBorderColor(XLColor.FromHtml(Hairline));

            row++;
        }

        var lastRow = Math.Max(row - 1, 1);
        ws.Range(1, 1, lastRow, headers.Length).SetAutoFilter();
        ws.SheetView.FreezeRows(1);

        // Temperature colour scale makes hot zones scannable without reading numbers.
        if (lastRow > 1)
        {
            ws.Range(2, 3, lastRow, 3).AddConditionalFormat().ColorScale()
                .LowestValue(XLColor.FromHtml("#DBEAFE"))
                .Midpoint(XLCFContentType.Number, "32", XLColor.FromHtml("#FEF3C7"))
                .HighestValue(XLColor.FromHtml("#FCA5A5"));
        }

        ws.Columns(1, headers.Length).AdjustToContents();
        // AdjustToContents ignores the filter dropdown glyph; keep headers readable.
        for (var c = 1; c <= headers.Length; c++)
        {
            ws.Column(c).Width = Math.Min(Math.Max(ws.Column(c).Width + 3, 12), 34);
        }

        ws.PageSetup.PrintAreas.Add(1, 1, lastRow, headers.Length);
        ws.PageSetup.SetRowsToRepeatAtTop(1, 1);
        ws.PageSetup.PageOrientation = XLPageOrientation.Landscape;
        ws.PageSetup.FitToPages(1, 0);
    }
}
