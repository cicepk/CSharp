using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TuneVault.Application.DTOs.Common;
using TuneVault.Application.DTOs.Follow;
using TuneVault.Application.Interfaces;
using TuneVault.Domain.Entities;
using TuneVault.Domain.Enums;

namespace TuneVault.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class FollowController : ControllerBase
{
    private readonly IFollowRepository _followRepo;
    private readonly IUserRepository _userRepo;
    private readonly INotificationRepository _notificationRepo;
    private readonly INotificationPushService _pushService;

    public FollowController(
        IFollowRepository followRepo,
        IUserRepository userRepo,
        INotificationRepository notificationRepo,
        INotificationPushService pushService)
    {
        _followRepo = followRepo;
        _userRepo = userRepo;
        _notificationRepo = notificationRepo;
        _pushService = pushService;
    }

    private Guid GetCurrentUserId()
    {
        var claim = User.FindFirst("userId") ?? User.FindFirst(ClaimTypes.NameIdentifier);
        return Guid.TryParse(claim?.Value, out var id) ? id : Guid.Empty;
    }

    // POST /api/follow — Follow một user
    [HttpPost]
    public async Task<IActionResult> Follow([FromBody] FollowRequest request, CancellationToken ct)
    {
        var followerId = GetCurrentUserId();

        if (request.UserId == Guid.Empty)
            return BadRequest(ApiResponse<object>.ErrorResponse("UserId is required"));
        if (request.UserId == followerId)
            return BadRequest(ApiResponse<object>.ErrorResponse("Cannot follow yourself"));

        var target = await _userRepo.GetByIdAsync(request.UserId, ct);
        if (target == null)
            return NotFound(ApiResponse<object>.ErrorResponse("User not found"));

        var alreadyFollowing = await _followRepo.IsFollowingAsync(followerId, request.UserId, ct);
        if (alreadyFollowing)
            return Conflict(ApiResponse<object>.ErrorResponse("Already following this user"));

        await _followRepo.FollowAsync(followerId, request.UserId, ct);

        // Notify the followed user
        var follower = await _userRepo.GetByIdAsync(followerId, ct);
        var notification = new Notification
        {
            Id = Guid.NewGuid(),
            UserId = request.UserId,
            Type = NotificationType.Followed,
            Message = $"{follower?.UserName ?? "Someone"} is now following you",
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        };
        await _notificationRepo.CreateAsync(notification, ct);

        // Push real-time qua SignalR
        await _pushService.PushAsync(
            request.UserId.ToString(),
            new
            {
                id        = notification.Id,
                type      = (int)notification.Type,
                message   = notification.Message,
                isRead    = false,
                createdAt = notification.CreatedAt
            }, ct);

        return Ok(ApiResponse<object>.SuccessResponse(null!, "Followed successfully"));
    }

    // DELETE /api/follow/{userId} — Unfollow một user
    [HttpDelete("{userId:guid}")]
    public async Task<IActionResult> Unfollow(Guid userId, CancellationToken ct)
    {
        var followerId = GetCurrentUserId();

        if (userId == followerId)
            return BadRequest(ApiResponse<object>.ErrorResponse("Cannot unfollow yourself"));

        var unfollowed = await _followRepo.UnfollowAsync(followerId, userId, ct);
        if (!unfollowed)
            return NotFound(ApiResponse<object>.ErrorResponse("You are not following this user"));

        return NoContent();
    }

    // GET /api/follow/{userId}/followers — Danh sách followers của user
    [HttpGet("{userId:guid}/followers")]
    public async Task<IActionResult> GetFollowers(Guid userId, CancellationToken ct)
    {
        var target = await _userRepo.GetByIdAsync(userId, ct);
        if (target == null)
            return NotFound(ApiResponse<object>.ErrorResponse("User not found"));

        var followers = await _followRepo.GetFollowersAsync(userId, ct);
        var dtos = followers.Select(u => new FollowerDto { Id = u.Id, Username = u.UserName }).ToList();

        return Ok(ApiResponse<List<FollowerDto>>.SuccessResponse(dtos));
    }

    // GET /api/follow/{userId}/following — Danh sách user đang follow
    [HttpGet("{userId:guid}/following")]
    public async Task<IActionResult> GetFollowing(Guid userId, CancellationToken ct)
    {
        var target = await _userRepo.GetByIdAsync(userId, ct);
        if (target == null)
            return NotFound(ApiResponse<object>.ErrorResponse("User not found"));

        var following = await _followRepo.GetFollowingAsync(userId, ct);
        var dtos = following.Select(u => new FollowerDto { Id = u.Id, Username = u.UserName }).ToList();

        return Ok(ApiResponse<List<FollowerDto>>.SuccessResponse(dtos));
    }

    // GET /api/follow/{userId}/status — Kiểm tra đang follow chưa
    [HttpGet("{userId:guid}/status")]
    public async Task<IActionResult> GetFollowStatus(Guid userId, CancellationToken ct)
    {
        var currentUserId = GetCurrentUserId();
        var isFollowing = await _followRepo.IsFollowingAsync(currentUserId, userId, ct);
        var followerCount = await _followRepo.GetFollowerCountAsync(userId, ct);
        var followingCount = await _followRepo.GetFollowingCountAsync(userId, ct);

        return Ok(ApiResponse<object>.SuccessResponse(new
        {
            isFollowing,
            followerCount,
            followingCount
        }));
    }
}
