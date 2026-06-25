namespace TuneVault.Application.DTOs.Admin;

public class AdminTrackDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Artist { get; set; } = string.Empty;
    public int MediaType { get; set; }
    public int DurationSeconds { get; set; }
    public string? CoverPath { get; set; }
    public DateTime CreatedAt { get; set; }
}
