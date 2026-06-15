namespace TuneVault.Application.DTOs.PlayHistory;

public class PlayHistoryDto
{
    public Guid Id { get; set; }
    public Guid MediaItemId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Artist { get; set; } = string.Empty;
    public string StreamUrl { get; set; } = string.Empty;
    public string? CoverPath { get; set; }
    public DateTime PlayedAt { get; set; }
}

public class RecordPlayRequest
{
    public Guid MediaItemId { get; set; }
    public int DurationSeconds { get; set; }
}
