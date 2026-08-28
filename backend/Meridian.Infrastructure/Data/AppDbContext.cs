using Microsoft.EntityFrameworkCore;
using Meridian.Core.Entities;

namespace Meridian.Infrastructure.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Location> Locations => Set<Location>();
    public DbSet<HeatReading> HeatReadings => Set<HeatReading>();
    public DbSet<Report> Reports => Set<Report>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        var seedDate = new DateTime(2026, 8, 1, 0, 0, 0, DateTimeKind.Utc);

        // Seed default locations
        modelBuilder.Entity<Location>().HasData(
            new Location { Id = Guid.Parse("11111111-1111-1111-1111-111111111111"), Name = "Downtown Phoenix", City = "Phoenix", Country = "USA", Latitude = 33.4484, Longitude = -112.0740, CreatedAt = seedDate },
            new Location { Id = Guid.Parse("22222222-2222-2222-2222-222222222222"), Name = "Dubai Marina", City = "Dubai", Country = "UAE", Latitude = 25.0819, Longitude = 55.1367, CreatedAt = seedDate },
            new Location { Id = Guid.Parse("33333333-3333-3333-3333-333333333333"), Name = "Karachi Saddar", City = "Karachi", Country = "Pakistan", Latitude = 24.8607, Longitude = 67.0011, CreatedAt = seedDate },
            new Location { Id = Guid.Parse("44444444-4444-4444-4444-444444444444"), Name = "Riyadh City Center", City = "Riyadh", Country = "Saudi Arabia", Latitude = 24.7136, Longitude = 46.6753, CreatedAt = seedDate }
        );
    }
}
