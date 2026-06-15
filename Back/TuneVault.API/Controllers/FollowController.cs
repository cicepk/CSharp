using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TuneVault.Application.DTOs.Common;
using TuneVault.Application.DTOs.Follow;
using TuneVault.Application.Features.Follow.Commands;
using TuneVault.Application.Features.Follow.Queries;

namespace TuneVault.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class FollowController : ControllerBase
{
    private readonly IMediator _mediator;

    public FollowController(IMediator mediator)
    {
        _mediator = mediator;
    }

    private Guid GetCurrentUserId()
    {
        var claim = User.FindFirst("userId") ?? User.FindFirst(ClaimTypes.NameIdentifier);
        return Guid.TryParse(claim?.Value, out var id) ? id : Guid.Empty;
    }

    // POST /api/follow
    [HttpPost]
    public async Task<IActionResult> Follow([FromBody] FollowRequest request, CancellationToken ct)
    {
        await _mediator.Send(new FollowUserCommand
        {
            FollowerId   = GetCurrentUserId(),
            TargetUserId = request.UserId
        }, ct);

        return Ok(ApiResponse<object>.SuccessResponse(null!, "Followed successfully"));
    }

    // DELETE /api/follow/{userId}
    [HttpDelete("{userId:guid}")]
    public async Task<IActionResult> Unfollow(Guid userId, CancellationToken ct)
    {
        await _mediator.Send(new UnfollowUserCommand
        {
            FollowerId   = GetCurrentUserId(),
            TargetUserId = userId
        }, ct);

        return NoContent();
    }

    // GET /api/follow/{userId}/followers
    [HttpGet("{userId:guid}/followers")]
    public async Task<IActionResult> GetFollowers(Guid userId, CancellationToken ct)
    {
        var result = await _mediator.Send(new GetFollowersQuery { UserId = userId }, ct);
        return Ok(ApiResponse<List<FollowerDto>>.SuccessResponse(result));
    }

    // GET /api/follow/{userId}/following
    [HttpGet("{userId:guid}/following")]
    public async Task<IActionResult> GetFollowing(Guid userId, CancellationToken ct)
    {
        var result = await _mediator.Send(new GetFollowingQuery { UserId = userId }, ct);
        return Ok(ApiResponse<List<FollowerDto>>.SuccessResponse(result));
    }

    // GET /api/follow/{userId}/status
    [HttpGet("{userId:guid}/status")]
    public async Task<IActionResult> GetFollowStatus(Guid userId, CancellationToken ct)
    {
        var result = await _mediator.Send(new GetFollowStatusQuery
        {
            CurrentUserId = GetCurrentUserId(),
            TargetUserId  = userId
        }, ct);

        return Ok(ApiResponse<object>.SuccessResponse(new
        {
            isFollowing    = result.IsFollowing,
            followerCount  = result.FollowerCount,
            followingCount = result.FollowingCount
        }));
    }
}
