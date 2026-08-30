using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace Meridian.API.Exports.Pdf;

public class HeatReportDocument : IDocument
{
    private static readonly string[] RiskOrder = ["Extreme", "High", "Moderate", "Low"];

    private readonly ReportExportModel _model;
    private readonly byte[]? _chartBytes;

    public HeatReportDocument(ReportExportModel model, byte[]? chartBytes)
    {
        _model = model;
        _chartBytes = chartBytes;
    }

    public DocumentMetadata GetMetadata() => new()
    {
        Title = _model.Title,
        Author = "Meridian",
        Subject = "Urban heat risk advisory",
        Creator = "Meridian Heat Intelligence",
    };

    // Text is the bulk of the document; caching layout state speeds repeat renders.
    public DocumentSettings GetSettings() => DocumentSettings.Default;

    public void Compose(IDocumentContainer container)
    {
        container.Page(page =>
        {
            page.Size(PageSizes.A4);
            page.Margin(38);
            page.PageColor(Colors.White);
            page.DefaultTextStyle(x => x
                .FontSize(10)
                .FontFamily(Fonts.Calibri)
                .FontColor(PdfTheme.Ink));

            page.Header().Element(ComposeHeader);
            page.Content().Element(ComposeContent);
            page.Footer().Element(ComposeFooter);
        });
    }

    private void ComposeHeader(IContainer container)
    {
        container.Column(col =>
        {
            col.Item().Row(row =>
            {
                row.RelativeItem().Column(c =>
                {
                    c.Item().Text(_model.Title)
                        .FontSize(21).Bold().FontColor(PdfTheme.Ink);
                    c.Item().PaddingTop(2).Text($"Generated {_model.Date} UTC")
                        .FontSize(9).FontColor(PdfTheme.Muted);
                });

                row.ConstantItem(120).AlignRight().AlignMiddle().Column(c =>
                {
                    c.Item().AlignRight().Text("MERIDIAN")
                        .FontSize(13).Bold().FontColor(PdfTheme.Accent).LetterSpacing(0.18f);
                    c.Item().AlignRight().Text("Heat Intelligence")
                        .FontSize(8).FontColor(PdfTheme.Faint);
                });
            });

            col.Item().PaddingTop(10).LineHorizontal(1.5f).LineColor(PdfTheme.Accent);
        });
    }

    private void ComposeContent(IContainer container)
    {
        container.PaddingTop(18).Column(column =>
        {
            column.Spacing(18);

            if (!string.IsNullOrWhiteSpace(_model.Description))
            {
                column.Item().Element(c => SectionTitle(c, "Executive summary"));
                column.Item().Background(PdfTheme.Surface).Padding(12)
                    .Text(_model.Description).FontSize(10).LineHeight(1.4f);
            }

            column.Item().Element(ComposeMetrics);
            column.Item().Element(ComposeRiskBreakdown);

            if (_chartBytes is { Length: > 0 })
            {
                column.Item().Element(c => SectionTitle(c, "Top 10 hottest zones"));
                column.Item().Image(_chartBytes).FitWidth();
            }

            column.Item().Element(c => SectionTitle(c, $"Zone details ({_model.Zones.Count})"));
            column.Item().Element(ComposeTable);
        });
    }

    private static void SectionTitle(IContainer container, string text) =>
        container.Text(text).FontSize(12).Bold().FontColor(PdfTheme.Ink);

    private void ComposeMetrics(IContainer container)
    {
        var hottest = _model.Zones.Count > 0 ? _model.Zones[0] : null;

        container.Row(row =>
        {
            row.Spacing(10);
            MetricCard(row, "Zones monitored", _model.Zones.Count.ToString(), PdfTheme.Ink);
            MetricCard(row, "Global average", $"{_model.GlobalAverageTemp:F1} °C", PdfTheme.Accent);
            MetricCard(row, "High / extreme risk", _model.HighRiskCount.ToString(), PdfTheme.RiskHigh);
            MetricCard(
                row,
                "Hottest zone",
                hottest is null ? "—" : $"{hottest.TemperatureCelsius:F1} °C",
                PdfTheme.RiskExtreme,
                hottest?.Location);
        });

        static void MetricCard(RowDescriptor row, string label, string value, string color, string? sub = null)
        {
            row.RelativeItem()
                .Background(PdfTheme.Surface)
                .BorderLeft(2.5f).BorderColor(color)
                .Padding(9)
                .Column(c =>
                {
                    c.Item().Text(label.ToUpperInvariant())
                        .FontSize(7).Bold().FontColor(PdfTheme.Muted).LetterSpacing(0.09f);
                    c.Item().PaddingTop(3).Text(value)
                        .FontSize(15).Bold().FontColor(color);
                    if (!string.IsNullOrWhiteSpace(sub))
                    {
                        c.Item().Text(sub).FontSize(7.5f).FontColor(PdfTheme.Faint);
                    }
                });
        }
    }

    private void ComposeRiskBreakdown(IContainer container)
    {
        var total = _model.Zones.Count;
        var counts = _model.Zones
            .GroupBy(z => z.RiskLevel, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(g => g.Key, g => g.Count(), StringComparer.OrdinalIgnoreCase);

        container.Column(col =>
        {
            col.Item().PaddingBottom(6).Element(c => SectionTitle(c, "Risk distribution"));

            col.Item().Row(row =>
            {
                row.Spacing(8);
                foreach (var level in RiskOrder)
                {
                    counts.TryGetValue(level, out var count);
                    var share = total == 0 ? 0d : (double)count / total;
                    var color = PdfTheme.GetRiskColor(level);

                    row.RelativeItem().Column(c =>
                    {
                        c.Item().Row(r =>
                        {
                            r.AutoItem().PaddingRight(5).AlignMiddle()
                                .Width(7).Height(7).Background(color);
                            r.RelativeItem().Text($"{level}")
                                .FontSize(9).Bold().FontColor(PdfTheme.Ink);
                        });
                        c.Item().PaddingTop(2).Text($"{count}  ({share:P0})")
                            .FontSize(9).FontColor(PdfTheme.Muted);

                        // Proportional bar: filled portion over a hairline track.
                        c.Item().PaddingTop(4).Height(4).Background(PdfTheme.Hairline)
                            .Row(bar =>
                            {
                                if (share > 0) bar.RelativeItem((float)share).Background(color);
                                if (share < 1) bar.RelativeItem((float)(1 - share));
                            });
                    });
                }
            });
        });
    }

    private void ComposeTable(IContainer container)
    {
        container.Table(table =>
        {
            table.ColumnsDefinition(columns =>
            {
                columns.RelativeColumn(3.2f);  // Location
                columns.RelativeColumn(2.0f);  // Country
                columns.RelativeColumn(1.5f);  // Temp
                columns.RelativeColumn(1.5f);  // Heat index
                columns.RelativeColumn(1.4f);  // Humidity
                columns.RelativeColumn(1.7f);  // Risk
            });

            table.Header(header =>
            {
                HeaderCell(header, "Location", TextAlign.Left);
                HeaderCell(header, "Country", TextAlign.Left);
                HeaderCell(header, "Temp", TextAlign.Right);
                HeaderCell(header, "Heat idx", TextAlign.Right);
                HeaderCell(header, "Humidity", TextAlign.Right);
                HeaderCell(header, "Risk", TextAlign.Center);
            });

            var i = 0;
            foreach (var zone in _model.Zones)
            {
                var zebra = i++ % 2 == 1;
                var riskColor = PdfTheme.GetRiskColor(zone.RiskLevel);

                Body(table, zebra).Text(zone.Location).FontSize(9).SemiBold();
                Body(table, zebra).Text(zone.Country).FontSize(9).FontColor(PdfTheme.Muted);
                Body(table, zebra).AlignRight().Text($"{zone.TemperatureCelsius:F1}°").FontSize(9);
                Body(table, zebra).AlignRight().Text($"{zone.HeatIndex:F1}°").FontSize(9).FontColor(PdfTheme.Muted);
                Body(table, zebra).AlignRight().Text($"{zone.Humidity:F0}%").FontSize(9).FontColor(PdfTheme.Muted);
                Body(table, zebra).AlignCenter().Text(zone.RiskLevel.ToUpperInvariant())
                    .FontSize(7.5f).Bold().FontColor(riskColor).LetterSpacing(0.05f);
            }
        });

        static void HeaderCell(TableCellDescriptor header, string text, TextAlign align)
        {
            var cell = header.Cell()
                .Background(PdfTheme.Ink)
                .PaddingVertical(6).PaddingHorizontal(6);

            var styled = align switch
            {
                TextAlign.Right => cell.AlignRight(),
                TextAlign.Center => cell.AlignCenter(),
                _ => cell,
            };

            styled.Text(text.ToUpperInvariant())
                .FontSize(7.5f).Bold().FontColor(Colors.White).LetterSpacing(0.07f);
        }

        static IContainer Body(TableDescriptor table, bool zebra)
        {
            var cell = table.Cell()
                .BorderBottom(0.5f).BorderColor(PdfTheme.Hairline)
                .PaddingVertical(4.5f).PaddingHorizontal(6);
            return zebra ? cell.Background(PdfTheme.Surface) : cell;
        }
    }

    private enum TextAlign { Left, Right, Center }

    private void ComposeFooter(IContainer container)
    {
        container.PaddingTop(8).Column(col =>
        {
            col.Item().LineHorizontal(0.5f).LineColor(PdfTheme.Hairline);
            col.Item().PaddingTop(5).Row(row =>
            {
                row.RelativeItem().Text("Meridian · FortyGuard API · 20 m² resolution · 2 m AGL")
                    .FontSize(7.5f).FontColor(PdfTheme.Faint);

                row.ConstantItem(90).AlignRight().Text(x =>
                {
                    x.DefaultTextStyle(s => s.FontSize(7.5f).FontColor(PdfTheme.Faint));
                    x.Span("Page ");
                    x.CurrentPageNumber();
                    x.Span(" / ");
                    x.TotalPages();
                });
            });
        });
    }
}
