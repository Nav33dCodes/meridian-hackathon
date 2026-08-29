using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Meridian.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddHeatReadingIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_HeatReadings_LocationId",
                table: "HeatReadings");

            migrationBuilder.CreateIndex(
                name: "IX_HeatReadings_LocationId_MeasuredAt",
                table: "HeatReadings",
                columns: new[] { "LocationId", "MeasuredAt" },
                descending: new[] { false, true });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_HeatReadings_LocationId_MeasuredAt",
                table: "HeatReadings");

            migrationBuilder.CreateIndex(
                name: "IX_HeatReadings_LocationId",
                table: "HeatReadings",
                column: "LocationId");
        }
    }
}
