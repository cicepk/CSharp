using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TuneVault.Application.DTOs.Common;
using TuneVault.Application.DTOs.Share;
using TuneVault.Application.Interfaces;
using TuneVault.Domain.Entities;
using TuneVault.Domain.Enums;

namespace TuneVault.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ShareController : ControllerBase
{
    private readonly IMediaShareRepository _shareRepo;
    private readonly IMediaItemRepository _mediaRepo;
    private readonly IUserRepository _userRepo;
    private readonly INotificationRepository _notificationRepo;

    public ShareController(
        IMediaShareRepository shareRepo,
        IMediaItemRepository mediaRepo,
        IUserRepository userRepo,
        INotificationRepository notificationRepo)
    {
        _shareRepo = shareRepo;
        _mediaRepo = mediaRepo;
        _userRepo = userRepo;
        _notificationRepo = notificationRepo;
    }

    private Guid GetCurrentUserId()
    {
        var claim = User.FindFirst("userId") ?? User.FindFirst(ClaimTypes.NameIdentifier);
        return Guid.TryParse(claim?.Value, out var id) ? id : Guid.Empty;
    }

    private static MediaShareDto ToDto(MediaShare s, string senderUsername) => new()
    {
        Id = s.Id,
        MediaItemId = s.MediaItemId,
        PlaylistId = null,
        SharedByUserId = s.SharedByUserId,
        SharedByUsername = senderUsername,
        SharedToUserId = s.SharedToUserId,
        SharedAt = s.SharedAt
    };

    // POST /api/share — Chia sẻ media cho user khác
    [HttpPost]
    public async Task<IActionResult> Share([FromBody] ShareMediaRequest request, CancellationToken ct)
    {
        var senderId = GetCurrentUserId();

        // Validation
        var errors = new List<string>();
        if (request.ReceiverUserId == Guid.Empty)
            errors.Add("ReceiverUserId is required");
        if (request.MediaItemId == null && request.PlaylistId == null)
            errors.Add("Either MediaItemId or PlaylistId must be provided");
        if (request.MediaItemId != null && request.PlaylistId != null)
            errors.Add("Cannot share both MediaItem and Playlist at the same time");
        if (request.ReceiverUserId == senderId)
            errors.Add("Cannot share with yourself");

        if (errors.Count > 0)
            return BadRequest(ApiResponse<object>.ErrorResponse(errors.ToArray(), "Validation failed"));

        // Verify receiver exists
        var receiver = await _userRepo.GetByIdAsync(request.ReceiverUserId, ct);
        if (receiver == null)
            return NotFound(ApiResponse<object>.ErrorResponse("Receiver user not found"));

        // Verify media exists (only mediaItemId support)
        if (request.MediaItemId != null)
        {
            var media = await _mediaRepo.GetByIdAsync(request.MediaItemId.Value, ct);
            if (media == null)
                return NotFound(ApiResponse<object>.ErrorResponse("Media not found"));

            // Check duplicate share
            var alreadyShared = await _shareRepo.ExistsAsync(request.MediaItemId.Value, senderId, request.ReceiverUserId, ct);
            if (alreadyShared)
                return Conflict(ApiResponse<object>.ErrorResponse("You already shared this media with this user"));

            var share = new MediaShare
            {
                Id = Guid.NewGuid(),
                MediaItemId = request.MediaItemId.Value,
                SharedByUserId = senderId,
                SharedToUserId = request.ReceiverUserId,
                SharedAt = DateTime.UtcNow
            };

            var shareId = await _shareRepo.CreateAsync(share, ct);

            // Get sender info for notification
            var sender = await _userRepo.GetByIdAsync(senderId, ct);
            var senderName = sender?.UserName ?? "Someone";

            // Create notification for receiver
            var notification = new Notification
            {
                Id = Guid.NewGuid(),
                UserId = request.ReceiverUserId,
                Type = NotificationType.Shared,
                Message = $"{senderName} shared \"{media.Title}\" with you",
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };
            await _notificationRepo.CreateAsync(notification, ct);

            share.Id = shareId;
            return CreatedAtAction(nameof(GetSharedWithMe),
                ApiResponse<MediaShareDto>.SuccessResponse(ToDto(share, senderName), "Shared successfully"));
        }

        return BadRequest(ApiResponse<object>.ErrorResponse("Playlist sharing not yet implemented"));
    }

    // GET /api/share/inbox — Nhận danh sách media được chia sẻ cho mình
    [HttpGet("inbox")]
    public async Task<IActionResult> GetSharedWithMe(CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        var shares = await _shareRepo.GetSharedWithMeAsync(userId, ct);

        var dtos = new List<MediaShareDto>();
        foreach (var s in shares)
        {
            var sender = await _userRepo.GetByIdAsync(s.SharedByUserId, ct);
            dtos.Add(ToDto(s, sender?.UserName ?? "Unknown"));
        }

        return Ok(ApiResponse<List<MediaShareDto>>.SuccessResponse(dtos));
    }

    // GET /api/share/sent — Danh sách media đã chia sẻ
    [HttpGet("sent")]
    public async Task<IActionResult> GetSharedByMe(CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        var shares = await _shareRepo.GetSharedByMeAsync(userId, ct);

        var sender = await _userRepo.GetByIdAsync(userId, ct);
        var senderName = sender?.UserName ?? "Unknown";

        var dtos = shares.Select(s => ToDto(s, senderName)).ToList();
        return Ok(ApiResponse<List<MediaShareDto>>.SuccessResponse(dtos));
    }

    // DELETE /api/share/{id} — Xóa share record
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var share = await _shareRepo.GetByIdAsync(id, ct);
        if (share == null)
            return NotFound(ApiResponse<object>.ErrorResponse("Share record not found"));

        var userId = GetCurrentUserId();
        if (share.SharedByUserId != userId && share.SharedToUserId != userId)
            return Forbid();

        await _shareRepo.DeleteAsync(id, ct);
        return NoContent();
    }
}
