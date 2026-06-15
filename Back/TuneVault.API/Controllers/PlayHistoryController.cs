using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TuneVault.Application.DTOs.Common;
using TuneVault.Application.DTOs.PlayHistory;
using TuneVault.Application.Features.PlayHistory.Commands;
using TuneVault.Application.Features.PlayHistory.Queries;

namespace TuneVault.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PlayHistoryController : ControllerBase
{
    private readonly IMediator _mediator;

    public PlayHistoryController(IMediator mediator)
    {
        _mediator = mediator;
    }

    private Guid GetCurrentUserId()
    {
        var claim = User.FindFirst("userId") ?? User.FindFirst(ClaimTypes.NameIdentifier);
        return Guid.TryParse(claim?.Value, out var id) ? id : Guid.Empty;
    }

    // GET /api/playhistory
    [HttpGet]
    public async Task<IActionResult> GetHistory(CancellationToken ct)
    {
        var result = await _mediator.Send(new GetPlayHistoryQuery
        {
            UserId  = GetCurrentUserId(),
            BaseUrl = $"{Request.Scheme}://{Request.Host}"
        }, ct);

        return Ok(ApiResponse<List<PlayHistoryDto>>.SuccessResponse(result));
    }

    // POST /api/playhistory
    [HttpPost]
    public async Task<IActionResult> Record([FromBody] RecordPlayRequest request, CancellationToken ct)
    {
        await _mediator.Send(new RecordPlayCommand
        {
            UserId          = GetCurrentUserId(),
            MediaItemId     = request.MediaItemId,
            DurationSeconds = request.DurationSeconds
        }, ct);

        return Ok(ApiResponse<object>.SuccessResponse(null!, "Play recorded"));
    }
}
