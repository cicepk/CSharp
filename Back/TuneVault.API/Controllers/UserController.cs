using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TuneVault.Application.DTOs.Common;
using TuneVault.Application.DTOs.User;
using TuneVault.Application.Features.User.Commands;
using TuneVault.Application.Features.User.Queries;
using TuneVault.Application.Interfaces;

namespace TuneVault.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UserController : ControllerBase
{
    private readonly IMediator           _mediator;
    private readonly IFileStorageService _fileStorageService;

    public UserController(IMediator mediator, IFileStorageService fileStorageService)
    {
        _mediator           = mediator;
        _fileStorageService = fileStorageService;
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

    // POST /api/user/me/avatar
    [HttpPost("me/avatar")]
    [Authorize]
    public async Task<IActionResult> UploadAvatar(IFormFile file, CancellationToken ct)
    {
        if (file == null || file.Length == 0)
            return BadRequest(ApiResponse<object>.ErrorResponse("No file provided"));

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        string[] allowed = [".jpg", ".jpeg", ".png", ".webp"];
        if (!allowed.Contains(ext))
            return BadRequest(ApiResponse<object>.ErrorResponse("Only JPG, PNG, WebP images are allowed"));

        if (file.Length > 5L * 1024 * 1024)
            return BadRequest(ApiResponse<object>.ErrorResponse("File size must be under 5MB"));

        var userId = GetCurrentUserId();

        // Lấy avatar path cũ trước khi save
        var currentUser = await _mediator.Send(new GetCurrentUserQuery { UserId = userId, BaseUrl = BaseUrl }, ct);
        var oldAvatarPath = currentUser.AvatarUrl != null
            ? "/" + string.Join("/", currentUser.AvatarUrl.Split('/').Skip(3))
            : null;

        using var stream   = file.OpenReadStream();
        var newAvatarPath  = await _fileStorageService.SaveAsync(stream, $"{userId}{ext}", "avatars", ct);

        var avatarUrl = await _mediator.Send(new UploadAvatarCommand
        {
            UserId        = userId,
            NewAvatarPath = newAvatarPath,
            OldAvatarPath = oldAvatarPath
        }, ct);

        return Ok(ApiResponse<object>.SuccessResponse(new
        {
            avatarUrl = avatarUrl.StartsWith("http") ? avatarUrl : $"{BaseUrl}{avatarUrl}"
        }, "Avatar updated"));
    }
}
