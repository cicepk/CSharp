using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TuneVault.Application.DTOs.Common;
using TuneVault.Application.DTOs.User;
using TuneVault.Application.Interfaces;

namespace TuneVault.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UserController : ControllerBase
{
    private readonly IUserRepository _userRepo;
    private readonly IFollowRepository _followRepo;

    public UserController(IUserRepository userRepo, IFollowRepository followRepo)
    {
        _userRepo = userRepo;
        _followRepo = followRepo;
    }

    private Guid GetCurrentUserId()
    {
        var claim = User.FindFirst("userId") ?? User.FindFirst(ClaimTypes.NameIdentifier);
        return Guid.TryParse(claim?.Value, out var id) ? id : Guid.Empty;
    }

    // GET /api/user/{id} — Thông tin công khai của user
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var user = await _userRepo.GetByIdAsync(id, ct);
        if (user == null)
            return NotFound(ApiResponse<object>.ErrorResponse("User not found"));

        var followerCount = await _followRepo.GetFollowerCountAsync(id, ct);
        var followingCount = await _followRepo.GetFollowingCountAsync(id, ct);

        var dto = new UserDto
        {
            Id = user.Id,
            Username = user.UserName,
            FollowerCount = followerCount,
            FollowingCount = followingCount,
            CreatedAt = user.CreatedAt
        };

        return Ok(ApiResponse<UserDto>.SuccessResponse(dto));
    }

    // GET /api/user/me — Thông tin đầy đủ của user hiện tại (cần auth)
    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> GetMe(CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        var user = await _userRepo.GetByIdAsync(userId, ct);
        if (user == null)
            return NotFound(ApiResponse<object>.ErrorResponse("User not found"));

        var followerCount = await _followRepo.GetFollowerCountAsync(userId, ct);
        var followingCount = await _followRepo.GetFollowingCountAsync(userId, ct);

        var dto = new UserDetailDto
        {
            Id = user.Id,
            Username = user.UserName,
            Email = user.Email,
            FollowerCount = followerCount,
            FollowingCount = followingCount,
            CreatedAt = user.CreatedAt
        };

        return Ok(ApiResponse<UserDetailDto>.SuccessResponse(dto));
    }

    // PUT /api/user/me — Cập nhật profile (cần auth)
    [HttpPut("me")]
    [Authorize]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request, CancellationToken ct)
    {
        var errors = new List<string>();
        if (string.IsNullOrWhiteSpace(request.Username) || request.Username.Length < 3)
            errors.Add("Username must be at least 3 characters");
        if (string.IsNullOrWhiteSpace(request.Email) || !request.Email.Contains('@'))
            errors.Add("Invalid email format");

        if (errors.Count > 0)
            return BadRequest(ApiResponse<object>.ErrorResponse(errors.ToArray(), "Validation failed"));

        var userId = GetCurrentUserId();
        var user = await _userRepo.GetByIdAsync(userId, ct);
        if (user == null)
            return NotFound(ApiResponse<object>.ErrorResponse("User not found"));

        // Check username conflict
        if (user.UserName != request.Username)
        {
            var existing = await _userRepo.GetByUsernameAsync(request.Username, ct);
            if (existing != null)
                return Conflict(ApiResponse<object>.ErrorResponse("Username already taken"));
        }

        // Check email conflict
        if (user.Email != request.Email)
        {
            var existing = await _userRepo.GetByEmailAsync(request.Email, ct);
            if (existing != null)
                return Conflict(ApiResponse<object>.ErrorResponse("Email already in use"));
        }

        user.UserName = request.Username;
        user.Email = request.Email;

        await _userRepo.UpdateAsync(user, ct);

        return Ok(ApiResponse<object>.SuccessResponse(new { userId, username = request.Username, email = request.Email }, "Profile updated"));
    }
}
