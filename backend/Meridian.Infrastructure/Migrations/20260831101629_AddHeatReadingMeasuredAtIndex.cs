using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Meridian.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddHeatReadingMeasuredAtIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_HeatReadings_MeasuredAt",
                table: "HeatReadings",
                column: "MeasuredAt",
                descending: new bool[0]);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_HeatReadings_MeasuredAt",
                table: "HeatReadings");
        }
    }
}
