using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TuneVault.Application.DTOs.Common;
using TuneVault.Application.DTOs.Notification;
using TuneVault.Application.Features.Notification.Commands;
using TuneVault.Application.Features.Notification.Queries;

namespace TuneVault.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NotificationController : ControllerBase
{
    private readonly IMediator _mediator;

    public NotificationController(IMediator mediator)
    {
        _mediator = mediator;
    }

    private Guid GetCurrentUserId()
    {
        var claim = User.FindFirst("userId") ?? User.FindFirst(ClaimTypes.NameIdentifier);
        return Guid.TryParse(claim?.Value, out var id) ? id : Guid.Empty;
    }

    // GET /api/notification
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] bool unreadOnly = false, CancellationToken ct = default)
    {
        var result = await _mediator.Send(new GetNotificationsQuery
        {
            UserId     = GetCurrentUserId(),
            UnreadOnly = unreadOnly
        }, ct);

        return Ok(ApiResponse<List<NotificationDto>>.SuccessResponse(result));
    }

    // GET /api/notification/unread-count
    [HttpGet("unread-count")]
    public async Task<IActionResult> GetUnreadCount(CancellationToken ct)
    {
        var count = await _mediator.Send(new GetUnreadCountQuery { UserId = GetCurrentUserId() }, ct);
        return Ok(ApiResponse<object>.SuccessResponse(new { count }));
    }

    // PUT /api/notification/{id}/read
    [HttpPut("{id:guid}/read")]
    public async Task<IActionResult> MarkAsRead(Guid id, CancellationToken ct)
    {
        await _mediator.Send(new MarkAsReadCommand
        {
            NotificationId = id,
            CurrentUserId  = GetCurrentUserId()
        }, ct);

        return Ok(ApiResponse<object>.SuccessResponse(null!, "Marked as read"));
    }

    // PUT /api/notification/read-all
    [HttpPut("read-all")]
    public async Task<IActionResult> MarkAllAsRead(CancellationToken ct)
    {
        var count = await _mediator.Send(new MarkAllAsReadCommand { UserId = GetCurrentUserId() }, ct);
        return Ok(ApiResponse<object>.SuccessResponse(new { updatedCount = count }, "All marked as read"));
    }

    // DELETE /api/notification/{id}
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await _mediator.Send(new DeleteNotificationCommand
        {
            NotificationId = id,
            CurrentUserId  = GetCurrentUserId()
        }, ct);

        return NoContent();
    }
}
