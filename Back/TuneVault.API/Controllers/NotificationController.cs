using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TuneVault.Application.DTOs.Common;
using TuneVault.Application.DTOs.Notification;
using TuneVault.Application.Interfaces;

namespace TuneVault.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NotificationController : ControllerBase
{
    private readonly INotificationRepository _notificationRepo;

    public NotificationController(INotificationRepository notificationRepo)
    {
        _notificationRepo = notificationRepo;
    }

    private Guid GetCurrentUserId()
    {
        var claim = User.FindFirst("userId") ?? User.FindFirst(ClaimTypes.NameIdentifier);
        return Guid.TryParse(claim?.Value, out var id) ? id : Guid.Empty;
    }

    // GET /api/notification — Lấy tất cả thông báo
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] bool unreadOnly = false, CancellationToken ct = default)
    {
        var userId = GetCurrentUserId();
        var notifications = await _notificationRepo.GetByUserIdAsync(userId, unreadOnly, ct);

        var dtos = notifications.Select(n => new NotificationDto
        {
            Id = n.Id,
            Type = (int)n.Type,
            Message = n.Message,
            SenderUsername = string.Empty,
            TargetId = null,
            IsRead = n.IsRead,
            CreatedAt = n.CreatedAt
        }).ToList();

        return Ok(ApiResponse<List<NotificationDto>>.SuccessResponse(dtos));
    }

    // GET /api/notification/unread-count — Số thông báo chưa đọc
    [HttpGet("unread-count")]
    public async Task<IActionResult> GetUnreadCount(CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        var count = await _notificationRepo.GetUnreadCountAsync(userId, ct);
        return Ok(ApiResponse<object>.SuccessResponse(new { count }));
    }

    // PUT /api/notification/{id}/read — Đánh dấu đã đọc
    [HttpPut("{id:guid}/read")]
    public async Task<IActionResult> MarkAsRead(Guid id, CancellationToken ct)
    {
        var notification = await _notificationRepo.GetByIdAsync(id, ct);
        if (notification == null)
            return NotFound(ApiResponse<object>.ErrorResponse("Notification not found"));

        if (notification.UserId != GetCurrentUserId())
            return Forbid();

        await _notificationRepo.MarkAsReadAsync(id, ct);
        return Ok(ApiResponse<object>.SuccessResponse(null!, "Marked as read"));
    }

    // PUT /api/notification/read-all — Đánh dấu tất cả đã đọc
    [HttpPut("read-all")]
    public async Task<IActionResult> MarkAllAsRead(CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        var count = await _notificationRepo.MarkAllAsReadAsync(userId, ct);
        return Ok(ApiResponse<object>.SuccessResponse(new { updatedCount = count }, "All marked as read"));
    }

    // DELETE /api/notification/{id} — Xóa thông báo
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var notification = await _notificationRepo.GetByIdAsync(id, ct);
        if (notification == null)
            return NotFound(ApiResponse<object>.ErrorResponse("Notification not found"));

        if (notification.UserId != GetCurrentUserId())
            return Forbid();

        await _notificationRepo.DeleteAsync(id, ct);
        return NoContent();
    }
}
