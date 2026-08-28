using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Meridian.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Locations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    City = table.Column<string>(type: "text", nullable: false),
                    Country = table.Column<string>(type: "text", nullable: false),
                    Latitude = table.Column<double>(type: "double precision", nullable: false),
                    Longitude = table.Column<double>(type: "double precision", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Locations", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Reports",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "text", nullable: false),
                    Content = table.Column<string>(type: "text", nullable: false),
                    LocationName = table.Column<string>(type: "text", nullable: true),
                    OverallRisk = table.Column<int>(type: "integer", nullable: false),
                    AverageTemperatureCelsius = table.Column<double>(type: "double precision", nullable: false),
                    PeakTemperatureCelsius = table.Column<double>(type: "double precision", nullable: false),
                    GeneratedBy = table.Column<string>(type: "text", nullable: false),
                    ModelUsed = table.Column<string>(type: "text", nullable: true),
                    Type = table.Column<int>(type: "integer", nullable: false),
                    PeriodStart = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    PeriodEnd = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Reports", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "HeatReadings",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    LocationId = table.Column<Guid>(type: "uuid", nullable: false),
                    TemperatureCelsius = table.Column<double>(type: "double precision", nullable: false),
                    HumidityPercent = table.Column<double>(type: "double precision", nullable: false),
                    HeatIndexCelsius = table.Column<double>(type: "double precision", nullable: false),
                    RiskLevel = table.Column<int>(type: "integer", nullable: false),
                    Resolution = table.Column<string>(type: "text", nullable: false),
                    MeasurementHeightMeters = table.Column<double>(type: "double precision", nullable: false),
                    MeasuredAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Source = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HeatReadings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_HeatReadings_Locations_LocationId",
                        column: x => x.LocationId,
                        principalTable: "Locations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "Locations",
                columns: new[] { "Id", "City", "Country", "CreatedAt", "Description", "IsActive", "Latitude", "Longitude", "Name", "UpdatedAt" },
                values: new object[,]
                {
                    { new Guid("11111111-1111-1111-1111-111111111111"), "Phoenix", "USA", new DateTime(2026, 8, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, true, 33.448399999999999, -112.074, "Downtown Phoenix", null },
                    { new Guid("22222222-2222-2222-2222-222222222222"), "Dubai", "UAE", new DateTime(2026, 8, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, true, 25.081900000000001, 55.136699999999998, "Dubai Marina", null },
                    { new Guid("33333333-3333-3333-3333-333333333333"), "Karachi", "Pakistan", new DateTime(2026, 8, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, true, 24.860700000000001, 67.001099999999994, "Karachi Saddar", null },
                    { new Guid("44444444-4444-4444-4444-444444444444"), "Riyadh", "Saudi Arabia", new DateTime(2026, 8, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, true, 24.7136, 46.6753, "Riyadh City Center", null }
                });

            migrationBuilder.CreateIndex(
                name: "IX_HeatReadings_LocationId",
                table: "HeatReadings",
                column: "LocationId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "HeatReadings");

            migrationBuilder.DropTable(
                name: "Reports");

            migrationBuilder.DropTable(
                name: "Locations");
        }
    }
}
