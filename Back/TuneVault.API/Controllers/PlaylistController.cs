using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TuneVault.Application.DTOs.Common;
using TuneVault.Application.DTOs.Playlist;
using TuneVault.Application.Features.Playlist.Commands;
using TuneVault.Application.Features.Playlist.Queries;

namespace TuneVault.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PlaylistController : ControllerBase
{
    private readonly IMediator _mediator;

    public PlaylistController(IMediator mediator)
    {
        _mediator = mediator;
    }

    private Guid   GetCurrentUserId() {
        var claim = User.FindFirst("userId") ?? User.FindFirst(ClaimTypes.NameIdentifier);
        return Guid.TryParse(claim?.Value, out var id) ? id : Guid.Empty;
    }

    private string BaseUrl => $"{Request.Scheme}://{Request.Host}";

    // GET /api/playlist
    [HttpGet]
    public async Task<IActionResult> GetMyPlaylists(CancellationToken ct)
    {
        var result = await _mediator.Send(new GetMyPlaylistsQuery
        {
            UserId  = GetCurrentUserId(),
            BaseUrl = BaseUrl
        }, ct);

        return Ok(ApiResponse<List<PlaylistDto>>.SuccessResponse(result));
    }

    // GET /api/playlist/{id}
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var result = await _mediator.Send(new GetPlaylistByIdQuery
        {
            PlaylistId    = id,
            CurrentUserId = GetCurrentUserId(),
            BaseUrl       = BaseUrl
        }, ct);

        return Ok(ApiResponse<PlaylistDetailDto>.SuccessResponse(result));
    }

    // POST /api/playlist
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreatePlaylistRequest request, CancellationToken ct)
    {
        var result = await _mediator.Send(new CreatePlaylistCommand
        {
            Name     = request.Name,
            IsPublic = request.IsPublic,
            OwnerId  = GetCurrentUserId()
        }, ct);

        return CreatedAtAction(nameof(GetById), new { id = result.Id },
            ApiResponse<PlaylistDto>.SuccessResponse(result, "Playlist created"));
    }

    // PUT /api/playlist/{id}
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdatePlaylistRequest request, CancellationToken ct)
    {
        var result = await _mediator.Send(new UpdatePlaylistCommand
        {
            PlaylistId    = id,
            CurrentUserId = GetCurrentUserId(),
            Name          = request.Name,
            IsPublic      = request.IsPublic
        }, ct);

        return Ok(ApiResponse<PlaylistDto>.SuccessResponse(result, "Updated successfully"));
    }

    // DELETE /api/playlist/{id}
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await _mediator.Send(new DeletePlaylistCommand
        {
            PlaylistId    = id,
            CurrentUserId = GetCurrentUserId()
        }, ct);

        return NoContent();
    }

    // POST /api/playlist/{id}/tracks
    [HttpPost("{id:guid}/tracks")]
    public async Task<IActionResult> AddTrack(Guid id, [FromBody] AddTrackToPlaylistRequest request, CancellationToken ct)
    {
        await _mediator.Send(new AddTrackCommand
        {
            PlaylistId    = id,
            CurrentUserId = GetCurrentUserId(),
            MediaItemId   = request.MediaItemId
        }, ct);

        return Ok(ApiResponse<object>.SuccessResponse(null!, "Track added to playlist"));
    }

    // PATCH /api/playlist/{id}/visibility
    [HttpPatch("{id:guid}/visibility")]
    public async Task<IActionResult> ToggleVisibility(Guid id, [FromBody] ToggleVisibilityRequest request, CancellationToken ct)
    {
        var isPublic = await _mediator.Send(new ToggleVisibilityCommand
        {
            PlaylistId    = id,
            CurrentUserId = GetCurrentUserId(),
            IsPublic      = request.IsPublic
        }, ct);

        return Ok(ApiResponse<object>.SuccessResponse(new { isPublic }, "Visibility updated"));
    }

    // GET /api/playlist/user/{userId}/public
    [HttpGet("user/{userId:guid}/public")]
    [AllowAnonymous]
    public async Task<IActionResult> GetPublicByUser(Guid userId, CancellationToken ct)
    {
        var result = await _mediator.Send(new GetPublicPlaylistsByUserQuery
        {
            UserId  = userId,
            BaseUrl = BaseUrl
        }, ct);

        return Ok(ApiResponse<List<PlaylistDto>>.SuccessResponse(result));
    }

    // DELETE /api/playlist/{id}/tracks/{mediaId}
    [HttpDelete("{id:guid}/tracks/{mediaId:guid}")]
    public async Task<IActionResult> RemoveTrack(Guid id, Guid mediaId, CancellationToken ct)
    {
        await _mediator.Send(new RemoveTrackCommand
        {
            PlaylistId    = id,
            CurrentUserId = GetCurrentUserId(),
            MediaItemId   = mediaId
        }, ct);

        return NoContent();
    }
}
