using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TuneVault.Application.DTOs.Admin;
using TuneVault.Application.DTOs.Common;
using TuneVault.Application.DTOs.Media;
using TuneVault.Application.Features.Admin.Commands;
using TuneVault.Application.Features.Admin.Queries;
using TuneVault.Domain.Entities;

namespace TuneVault.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly IMediator _mediator;

    public AdminController(IMediator mediator)
    {
        _mediator = mediator;
    }

    private string BaseUrl => $"{Request.Scheme}://{Request.Host}";

    // GET /api/admin/stats
    [HttpGet("stats")]
    public async Task<IActionResult> GetStats(CancellationToken ct)
    {
        var result = await _mediator.Send(new GetAdminStatsQuery(), ct);
        return Ok(ApiResponse<AdminStatsDto>.SuccessResponse(result));
    }

    // GET /api/admin/users
    [HttpGet("users")]
    public async Task<IActionResult> GetUsers(CancellationToken ct)
    {
        var result = await _mediator.Send(new GetAdminUsersQuery(), ct);
        return Ok(ApiResponse<List<AdminUserDto>>.SuccessResponse(result));
    }

    // GET /api/admin/users/{id}/tracks
    [HttpGet("users/{id:guid}/tracks")]
    public async Task<IActionResult> GetUserTracks(Guid id, CancellationToken ct)
    {
        var tracks = await _mediator.Send(new GetUserTracksAdminQuery { UserId = id, BaseUrl = BaseUrl }, ct);
        return Ok(ApiResponse<List<AdminTrackDto>>.SuccessResponse(tracks));
    }

    // DELETE /api/admin/tracks/{id}
    [HttpDelete("tracks/{id:guid}")]
    public async Task<IActionResult> DeleteTrack(Guid id, CancellationToken ct)
    {
        await _mediator.Send(new DeleteTrackByAdminCommand { TrackId = id }, ct);
        return Ok(ApiResponse<object>.SuccessResponse(new { }, "Track deleted"));
    }

    // DELETE /api/admin/users/{id}
    [HttpDelete("users/{id:guid}")]
    public async Task<IActionResult> DeleteUser(Guid id, CancellationToken ct)
    {
        await _mediator.Send(new DeleteUserByAdminCommand { UserId = id }, ct);
        return Ok(ApiResponse<object>.SuccessResponse(new { }, "User deleted"));
    }
}
