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
    private readonly IWebHostEnvironment _env;

    public UserController(IUserRepository userRepo, IFollowRepository followRepo, IWebHostEnvironment env)
    {
        _userRepo = userRepo;
        _followRepo = followRepo;
        _env = env;
    }

    private Guid GetCurrentUserId()
    {
        var claim = User.FindFirst("userId") ?? User.FindFirst(ClaimTypes.NameIdentifier);
        return Guid.TryParse(claim?.Value, out var id) ? id : Guid.Empty;
    }

    private string BaseUrl => $"{Request.Scheme}://{Request.Host}";

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
            Bio = user.Bio,
            AvatarUrl = user.AvatarPath != null ? $"{BaseUrl}{user.AvatarPath}" : null,
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
            Bio = user.Bio,
            AvatarUrl = user.AvatarPath != null ? $"{BaseUrl}{user.AvatarPath}" : null,
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
        if (request.Bio != null && request.Bio.Length > 300)
            errors.Add("Bio must be 300 characters or less");

        if (errors.Count > 0)
            return BadRequest(ApiResponse<object>.ErrorResponse(errors.ToArray(), "Validation failed"));

        var userId = GetCurrentUserId();
        var user = await _userRepo.GetByIdAsync(userId, ct);
        if (user == null)
            return NotFound(ApiResponse<object>.ErrorResponse("User not found"));

        if (user.UserName != request.Username)
        {
            var existing = await _userRepo.GetByUsernameAsync(request.Username, ct);
            if (existing != null)
                return Conflict(ApiResponse<object>.ErrorResponse("Username already taken"));
        }

        if (user.Email != request.Email)
        {
            var existing = await _userRepo.GetByEmailAsync(request.Email, ct);
            if (existing != null)
                return Conflict(ApiResponse<object>.ErrorResponse("Email already in use"));
        }

        user.UserName = request.Username;
        user.Email = request.Email;
        user.Bio = request.Bio;

        await _userRepo.UpdateAsync(user, ct);

        return Ok(ApiResponse<object>.SuccessResponse(new
        {
            userId,
            username = request.Username,
            email = request.Email,
            bio = request.Bio
        }, "Profile updated"));
    }

    // GET /api/user/search?q= — Tìm kiếm user theo username
    [HttpGet("search")]
    [Authorize]
    public async Task<IActionResult> Search([FromQuery] string q, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(q) || q.Length < 2)
            return Ok(ApiResponse<object>.SuccessResponse(Array.Empty<object>()));

        var users = await _userRepo.SearchAsync(q.Trim(), limit: 10, ct);
        var currentUserId = GetCurrentUserId();

        var dtos = users
            .Where(u => u.Id != currentUserId)
            .Select(u => new
            {
                id        = u.Id,
                username  = u.UserName,
                avatarUrl = u.AvatarPath != null ? $"{BaseUrl}{u.AvatarPath}" : (string?)null,
                bio       = u.Bio
            });

        return Ok(ApiResponse<object>.SuccessResponse(dtos));
    }

    // POST /api/user/me/avatar — Upload avatar (cần auth)
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
        var user = await _userRepo.GetByIdAsync(userId, ct);
        if (user == null)
            return NotFound(ApiResponse<object>.ErrorResponse("User not found"));

        var avatarsDir = Path.Combine(_env.WebRootPath, "uploads", "avatars");
        Directory.CreateDirectory(avatarsDir);

        // Xóa avatar cũ nếu có
        if (!string.IsNullOrEmpty(user.AvatarPath))
        {
            var oldFile = Path.Combine(_env.WebRootPath, user.AvatarPath.TrimStart('/').Replace('/', Path.DirectorySeparatorChar));
            if (System.IO.File.Exists(oldFile))
                System.IO.File.Delete(oldFile);
        }

        var fileName = $"{userId}{ext}";
        var savePath = Path.Combine(avatarsDir, fileName);

        using (var stream = new FileStream(savePath, FileMode.Create))
            await file.CopyToAsync(stream, ct);

        user.AvatarPath = $"/uploads/avatars/{fileName}";
        await _userRepo.UpdateAsync(user, ct);

        return Ok(ApiResponse<object>.SuccessResponse(new
        {
            avatarUrl = $"{BaseUrl}{user.AvatarPath}"
        }, "Avatar updated"));
    }
}
