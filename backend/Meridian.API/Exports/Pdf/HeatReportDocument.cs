using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace Meridian.API.Exports.Pdf;

public class HeatReportDocument : IDocument
{
    private readonly ReportExportModel _model;
    private readonly IChartRenderer _chartRenderer;

    public HeatReportDocument(ReportExportModel model, IChartRenderer chartRenderer)
    {
        _model = model;
        _chartRenderer = chartRenderer;
    }

    public DocumentMetadata GetMetadata() => DocumentMetadata.Default;

    public void Compose(IDocumentContainer container)
    {
        container
            .Page(page =>
            {
                page.Margin(50);
                page.Size(PageSizes.A4);
                page.PageColor(Colors.White);
                page.DefaultTextStyle(x => x.FontSize(11).FontFamily("Arial"));

                page.Header().Element(ComposeHeader);
                page.Content().Element(ComposeContent);
                page.Footer().Element(ComposeFooter);
            });
    }

    void ComposeHeader(IContainer container)
    {
        container.Row(row =>
        {
            row.RelativeItem().Column(column =>
            {
                column.Item().Text(_model.Title).FontSize(24).SemiBold().FontColor(PdfTheme.PrimaryColor);
                column.Item().Text(text =>
                {
                    text.Span("Generated on: ").SemiBold();
                    text.Span(_model.Date);
                });
            });
        });
    }

    void ComposeContent(IContainer container)
    {
        container.PaddingVertical(20).Column(column =>
        {
            column.Spacing(20);

            if (!string.IsNullOrEmpty(_model.Description))
            {
                column.Item().Text("Executive Summary").FontSize(14).SemiBold();
                column.Item().Text(_model.Description);
            }

            // Summary Stats
            column.Item().Row(row =>
            {
                row.RelativeItem().Column(c =>
                {
                    c.Item().Text("Global Avg Temp").SemiBold();
                    c.Item().Text($"{_model.GlobalAverageTemp:F1}°C").FontSize(16).FontColor(PdfTheme.PrimaryColor);
                });
                row.RelativeItem().Column(c =>
                {
                    c.Item().Text("High Risk Zones").SemiBold();
                    c.Item().Text(_model.HighRiskCount.ToString()).FontSize(16).FontColor(PdfTheme.DangerColor);
                });
                row.RelativeItem().Column(c =>
                {
                    c.Item().Text("Total Monitored").SemiBold();
                    c.Item().Text(_model.Zones.Count.ToString()).FontSize(16);
                });
            });

            // Chart
            if (_model.Zones.Any())
            {
                var chartBytes = _chartRenderer.GenerateTemperatureTrendChart(_model.Zones);
                column.Item().Image(chartBytes);
            }

            // Table
            column.Item().Text("Zone Details").FontSize(14).SemiBold();
            column.Item().Element(ComposeTable);
        });
    }

    void ComposeTable(IContainer container)
    {
        container.Table(table =>
        {
            table.ColumnsDefinition(columns =>
            {
                columns.RelativeColumn(3); // Location
                columns.RelativeColumn(2); // Temp
                columns.RelativeColumn(2); // Risk
            });

            table.Header(header =>
            {
                header.Cell().Element(CellStyle).Text("Location");
                header.Cell().Element(CellStyle).Text("Temp (°C)");
                header.Cell().Element(CellStyle).Text("Risk Level");

                static IContainer CellStyle(IContainer container)
                {
                    return container.DefaultTextStyle(x => x.SemiBold()).PaddingVertical(5).BorderBottom(1).BorderColor(Colors.Black);
                }
            });

            foreach (var zone in _model.Zones)
            {
                var riskColor = PdfTheme.GetRiskColor(zone.RiskLevel);

                table.Cell().Element(CellStyle).Text(zone.Location);
                table.Cell().Element(CellStyle).Text($"{zone.TemperatureCelsius:F1}°");
                table.Cell().Element(CellStyle).Text(zone.RiskLevel).FontColor(riskColor).SemiBold();

                static IContainer CellStyle(IContainer container)
                {
                    return container.BorderBottom(1).BorderColor(Colors.Grey.Lighten2).PaddingVertical(5);
                }
            }
        });
    }

    void ComposeFooter(IContainer container)
    {
        container.AlignCenter().Text(x =>
        {
            x.Span("Page ");
            x.CurrentPageNumber();
            x.Span(" of ");
            x.TotalPages();
        });
    }
}
