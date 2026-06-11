using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TuneVault.Application.DTOs.Common;
using TuneVault.Application.DTOs.Favourite;
using TuneVault.Application.DTOs.Media;
using TuneVault.Application.Interfaces;

namespace TuneVault.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class FavouriteController : ControllerBase
{
    private readonly IFavouriteRepository _favouriteRepo;
    private readonly IMediaItemRepository _mediaRepo;

    public FavouriteController(IFavouriteRepository favouriteRepo, IMediaItemRepository mediaRepo)
    {
        _favouriteRepo = favouriteRepo;
        _mediaRepo = mediaRepo;
    }

    private Guid GetCurrentUserId()
    {
        var claim = User.FindFirst("userId") ?? User.FindFirst(ClaimTypes.NameIdentifier);
        return Guid.TryParse(claim?.Value, out var id) ? id : Guid.Empty;
    }

    // GET /api/favourite — Lấy danh sách bài hát yêu thích
    [HttpGet]
    public async Task<IActionResult> GetFavourites(CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        var items = await _favouriteRepo.GetByUserIdAsync(userId, 100, ct);

        var dtos = items.Select(m => new FavouriteDto
        {
            MediaItemId = m.Id,
            Title = m.Title,
            Artist = m.Artist,
            AddedAt = DateTime.UtcNow
        }).ToList();

        return Ok(ApiResponse<List<FavouriteDto>>.SuccessResponse(dtos));
    }

    // POST /api/favourite/toggle — Toggle yêu thích/bỏ yêu thích
    [HttpPost("toggle")]
    public async Task<IActionResult> Toggle([FromBody] ToggleFavouriteRequest request, CancellationToken ct)
    {
        if (request.MediaItemId == Guid.Empty)
            return BadRequest(ApiResponse<object>.ErrorResponse("MediaItemId is required"));

        var media = await _mediaRepo.GetByIdAsync(request.MediaItemId, ct);
        if (media == null)
            return NotFound(ApiResponse<object>.ErrorResponse("Media not found"));

        var userId = GetCurrentUserId();
        var exists = await _favouriteRepo.ExistsAsync(userId, request.MediaItemId, ct);

        if (exists)
        {
            await _favouriteRepo.RemoveAsync(userId, request.MediaItemId, ct);
            return Ok(ApiResponse<object>.SuccessResponse(new { isFavourite = false }, "Removed from favourites"));
        }
        else
        {
            await _favouriteRepo.AddAsync(userId, request.MediaItemId, ct);
            return Ok(ApiResponse<object>.SuccessResponse(new { isFavourite = true }, "Added to favourites"));
        }
    }

    // GET /api/favourite/{mediaId}/status — Kiểm tra trạng thái yêu thích
    [HttpGet("{mediaId:guid}/status")]
    public async Task<IActionResult> GetStatus(Guid mediaId, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        var exists = await _favouriteRepo.ExistsAsync(userId, mediaId, ct);
        return Ok(ApiResponse<object>.SuccessResponse(new { isFavourite = exists }));
    }
}
