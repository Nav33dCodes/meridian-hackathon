using Meridian.Core.Common;

namespace Meridian.Core.Entities;

public class Location : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;

    public ICollection<HeatReading> HeatReadings { get; set; } = [];
}
