namespace TuneVault.Application.DTOs.Favourite;

/// <summary>
/// Like/Unlike (toggle) một bài hát
/// POST /favorites/{mediaItemId} (add), DELETE /favorites/{mediaItemId} (remove)
/// </summary>
public class ToggleFavouriteRequest
{
    // ID của bài hát cần like/unlike
    public Guid MediaItemId { get; set; }
}
