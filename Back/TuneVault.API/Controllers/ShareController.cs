using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TuneVault.Application.DTOs.Common;
using TuneVault.Application.DTOs.Share;
using TuneVault.Application.Features.Share.Commands;
using TuneVault.Application.Features.Share.Queries;

namespace TuneVault.API.Controllers;

[ApiController]
[Route("api/share")]
[Authorize]
public class ShareController : ControllerBase
{
    private readonly IMediator _mediator;

    public ShareController(IMediator mediator)
    {
        _mediator = mediator;
    }

    private Guid GetCurrentUserId()
    {
        var claim = User.FindFirst("userId") ?? User.FindFirst(ClaimTypes.NameIdentifier);
        return Guid.TryParse(claim?.Value, out var id) ? id : Guid.Empty;
    }

    // POST /api/share
    [HttpPost]
    public async Task<IActionResult> ShareMedia([FromBody] ShareMediaRequest request, CancellationToken ct)
    {
        var shareId = await _mediator.Send(new ShareMediaCommand
        {
            SenderId       = GetCurrentUserId(),
            ReceiverUserId = request.ReceiverUserId,
            MediaItemId    = request.MediaItemId,
            PlaylistId     = request.PlaylistId
        }, ct);

        return Ok(ApiResponse<Guid>.SuccessResponse(shareId, "Shared successfully"));
    }

    // GET /api/share/inbox
    [HttpGet("inbox")]
    public async Task<IActionResult> GetInbox(CancellationToken ct)
    {
        var result = await _mediator.Send(new GetShareInboxQuery { UserId = GetCurrentUserId() }, ct);
        return Ok(ApiResponse<IEnumerable<MediaShareDto>>.SuccessResponse(result, "Inbox retrieved successfully"));
    }

    // GET /api/share/sent
    [HttpGet("sent")]
    public async Task<IActionResult> GetSent(CancellationToken ct)
    {
        var result = await _mediator.Send(new GetShareSentQuery { UserId = GetCurrentUserId() }, ct);
        return Ok(ApiResponse<IEnumerable<MediaShareDto>>.SuccessResponse(result, "Sent list retrieved successfully"));
    }

    // DELETE /api/share/{id}
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await _mediator.Send(new DeleteShareCommand { ShareId = id, CurrentUserId = GetCurrentUserId() }, ct);
        return NoContent();
    }
}
