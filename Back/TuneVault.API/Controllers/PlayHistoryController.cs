using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TuneVault.Application.DTOs.Common;
using TuneVault.Application.DTOs.PlayHistory;
using TuneVault.Application.Interfaces;

namespace TuneVault.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PlayHistoryController : ControllerBase
{
    private readonly IPlayHistoryRepository _historyRepo;
    private readonly IMediaItemRepository _mediaRepo;

    public PlayHistoryController(IPlayHistoryRepository historyRepo, IMediaItemRepository mediaRepo)
    {
        _historyRepo = historyRepo;
        _mediaRepo = mediaRepo;
    }

    private Guid GetCurrentUserId()
    {
        var claim = User.FindFirst("userId") ?? User.FindFirst(ClaimTypes.NameIdentifier);
        return Guid.TryParse(claim?.Value, out var id) ? id : Guid.Empty;
    }

    // GET /api/playhistory — 10 bài nghe gần nhất
    [HttpGet]
    public async Task<IActionResult> GetHistory(CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        var history = await _historyRepo.GetRecentByUserIdAsync(userId, 10, ct);

        var dtos = new List<PlayHistoryDto>();
        foreach (var h in history)
        {
            var media = await _mediaRepo.GetByIdAsync(h.MediaItemId, ct);
            if (media == null) continue;

            var baseUrl = $"{Request.Scheme}://{Request.Host}";
            dtos.Add(new PlayHistoryDto
            {
                Id = h.Id,
                MediaItemId = h.MediaItemId,
                Title = media.Title,
                Artist = media.Artist,
                StreamUrl = $"{baseUrl}/api/mediaitems/{media.Id}/stream",
                CoverPath = media.CoverPath != null ? $"{baseUrl}{media.CoverPath}" : null,
                PlayedAt = h.PlayedAt
            });
        }

        return Ok(ApiResponse<List<PlayHistoryDto>>.SuccessResponse(dtos));
    }

    // POST /api/playhistory — Ghi nhận lượt nghe
    [HttpPost]
    public async Task<IActionResult> Record([FromBody] RecordPlayRequest request, CancellationToken ct)
    {
        if (request.MediaItemId == Guid.Empty)
            return BadRequest(ApiResponse<object>.ErrorResponse("MediaItemId is required"));

        var media = await _mediaRepo.GetByIdAsync(request.MediaItemId, ct);
        if (media == null)
            return NotFound(ApiResponse<object>.ErrorResponse("Media not found"));

        var userId = GetCurrentUserId();
        await _historyRepo.RecordAsync(userId, request.MediaItemId, request.DurationSeconds, ct);

        return Ok(ApiResponse<object>.SuccessResponse(null!, "Play recorded"));
    }
}
