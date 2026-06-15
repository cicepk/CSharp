using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TuneVault.Application.DTOs.Common;
using TuneVault.Application.DTOs.Favourite;
using TuneVault.Application.Features.Favourite.Commands;
using TuneVault.Application.Features.Favourite.Queries;

namespace TuneVault.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class FavouriteController : ControllerBase
{
    private readonly IMediator _mediator;

    public FavouriteController(IMediator mediator)
    {
        _mediator = mediator;
    }

    private Guid GetCurrentUserId()
    {
        var claim = User.FindFirst("userId") ?? User.FindFirst(ClaimTypes.NameIdentifier);
        return Guid.TryParse(claim?.Value, out var id) ? id : Guid.Empty;
    }

    // GET /api/favourite
    [HttpGet]
    public async Task<IActionResult> GetFavourites(CancellationToken ct)
    {
        var result = await _mediator.Send(new GetFavouritesQuery { UserId = GetCurrentUserId() }, ct);
        return Ok(ApiResponse<List<FavouriteDto>>.SuccessResponse(result));
    }

    // POST /api/favourite/toggle
    [HttpPost("toggle")]
    public async Task<IActionResult> Toggle([FromBody] ToggleFavouriteRequest request, CancellationToken ct)
    {
        var isFavourite = await _mediator.Send(new ToggleFavouriteCommand
        {
            UserId      = GetCurrentUserId(),
            MediaItemId = request.MediaItemId
        }, ct);

        var msg = isFavourite ? "Added to favourites" : "Removed from favourites";
        return Ok(ApiResponse<object>.SuccessResponse(new { isFavourite }, msg));
    }

    // GET /api/favourite/{mediaId}/status
    [HttpGet("{mediaId:guid}/status")]
    public async Task<IActionResult> GetStatus(Guid mediaId, CancellationToken ct)
    {
        var isFavourite = await _mediator.Send(new GetFavouriteStatusQuery
        {
            UserId      = GetCurrentUserId(),
            MediaItemId = mediaId
        }, ct);

        return Ok(ApiResponse<object>.SuccessResponse(new { isFavourite }));
    }
}
