using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TuneVault.Application.DTOs.Common;
using TuneVault.Application.DTOs.User;
using TuneVault.Application.DTOs.Auth;
using TuneVault.Application.Features.Auth.Commands;
using TuneVault.Application.Features.User.Commands;
using TuneVault.Application.Features.User.Queries;

namespace TuneVault.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UserController : ControllerBase
{
    private readonly IMediator _mediator;

    public UserController(IMediator mediator)
    {
        _mediator = mediator;
    }

    private Guid   GetCurrentUserId() {
        var claim = User.FindFirst("userId") ?? User.FindFirst(ClaimTypes.NameIdentifier);
        return Guid.TryParse(claim?.Value, out var id) ? id : Guid.Empty;
    }

    private string BaseUrl => $"{Request.Scheme}://{Request.Host}";

    // GET /api/user/{id}
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var result = await _mediator.Send(new GetUserByIdQuery { UserId = id, BaseUrl = BaseUrl }, ct);
        return Ok(ApiResponse<UserDto>.SuccessResponse(result));
    }

    // GET /api/user/me
    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> GetMe(CancellationToken ct)
    {
        var result = await _mediator.Send(new GetCurrentUserQuery
        {
            UserId  = GetCurrentUserId(),
            BaseUrl = BaseUrl
        }, ct);

        return Ok(ApiResponse<UserDetailDto>.SuccessResponse(result));
    }

    // PUT /api/user/me
    [HttpPut("me")]
    [Authorize]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request, CancellationToken ct)
    {
        var result = await _mediator.Send(new UpdateProfileCommand
        {
            UserId   = GetCurrentUserId(),
            Username = request.Username,
            Email    = request.Email,
            Bio      = request.Bio
        }, ct);

        return Ok(ApiResponse<object>.SuccessResponse(result, "Profile updated"));
    }

    // GET /api/user/search?q=
    [HttpGet("search")]
    [Authorize]
    public async Task<IActionResult> Search([FromQuery] string q, CancellationToken ct)
    {
        var result = await _mediator.Send(new SearchUsersQuery
        {
            Q             = q,
            CurrentUserId = GetCurrentUserId(),
            BaseUrl       = BaseUrl
        }, ct);

        return Ok(ApiResponse<List<UserSearchResultDto>>.SuccessResponse(result));
    }

    // PUT /api/user/me/password
    [HttpPut("me/password")]
    [Authorize]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request, CancellationToken ct)
    {
        await _mediator.Send(new ChangePasswordCommand
        {
            UserId          = GetCurrentUserId(),
            CurrentPassword = request.CurrentPassword,
            NewPassword     = request.NewPassword
        }, ct);

        return Ok(ApiResponse<object>.SuccessResponse(null, "Password changed successfully"));
    }

    // POST /api/user/me/avatar
    [HttpPost("me/avatar")]
    [Authorize]
    public async Task<IActionResult> UploadAvatar(IFormFile file, CancellationToken ct)
    {
        // File validation lives in UploadAvatarValidator; controller only reads the stream + metadata.
        using var stream = file is { Length: > 0 } ? file.OpenReadStream() : System.IO.Stream.Null;

        var newAvatarPath = await _mediator.Send(new UploadAvatarCommand
        {
            UserId        = GetCurrentUserId(),
            FileStream    = stream,
            FileName      = file?.FileName ?? string.Empty,
            FileSizeBytes = file?.Length ?? 0
        }, ct);

        var avatarUrl = newAvatarPath.StartsWith("http") ? newAvatarPath : $"{BaseUrl}{newAvatarPath}";
        return Ok(ApiResponse<object>.SuccessResponse(new { avatarUrl }, "Avatar updated"));
    }
}
