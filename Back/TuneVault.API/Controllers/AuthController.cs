using Microsoft.AspNetCore.Mvc;
using TuneVault.Application.DTOs.Auth;
using TuneVault.Application.DTOs.Common;
using TuneVault.Application.Interfaces;
using TuneVault.Domain.Entities;

namespace TuneVault.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IUserRepository _userRepository;
    private readonly IJwtService _jwtService;

    public AuthController(IUserRepository userRepository, IJwtService jwtService)
    {
        _userRepository = userRepository;
        _jwtService = jwtService;
    }

    // POST /api/auth/register
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request, CancellationToken ct)
    {
        // Validation
        var errors = new List<string>();
        if (string.IsNullOrWhiteSpace(request.Username) || request.Username.Length < 3 || request.Username.Length > 50)
            errors.Add("Username must be 3-50 characters");
        if (string.IsNullOrWhiteSpace(request.Email) || !request.Email.Contains('@'))
            errors.Add("Invalid email format");
        if (string.IsNullOrWhiteSpace(request.Password) || request.Password.Length < 8)
            errors.Add("Password must be at least 8 characters");
        if (!request.Password.Any(char.IsUpper))
            errors.Add("Password must contain at least 1 uppercase letter");
        if (!request.Password.Any(char.IsDigit))
            errors.Add("Password must contain at least 1 digit");
        if (request.Password != request.ConfirmPassword)
            errors.Add("Passwords do not match");

        if (errors.Count > 0)
            return BadRequest(ApiResponse<object>.ErrorResponse(errors.ToArray(), "Validation failed"));

        // Check duplicate email/username
        var existingByEmail = await _userRepository.GetByEmailAsync(request.Email, ct);
        if (existingByEmail != null)
            return Conflict(ApiResponse<object>.ErrorResponse("Email already in use"));

        var existingByUsername = await _userRepository.GetByUsernameAsync(request.Username, ct);
        if (existingByUsername != null)
            return Conflict(ApiResponse<object>.ErrorResponse("Username already taken"));

        // Create user
        var passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);
        var user = new UserProfile
        {
            Id = Guid.NewGuid(),
            UserName = request.Username,
            Email = request.Email,
            CreatedAt = DateTime.UtcNow
        };

        var userId = await _userRepository.CreateAsync(user, passwordHash, ct);

        var token = _jwtService.GenerateToken(userId, request.Username, request.Email);
        var response = new LoginResponse
        {
            UserId = userId,
            Username = request.Username,
            Email = request.Email,
            Token = token,
            ExpiresAt = _jwtService.GetExpirationDate()
        };

        return CreatedAtAction(nameof(Register), ApiResponse<LoginResponse>.SuccessResponse(response, "Registration successful"));
    }

    // POST /api/auth/login
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
            return BadRequest(ApiResponse<object>.ErrorResponse("Email and password are required"));

        var user = await _userRepository.GetByEmailAsync(request.Email, ct);
        if (user == null)
            return Unauthorized(ApiResponse<object>.ErrorResponse("Invalid email or password"));

        var passwordHash = await _userRepository.GetPasswordHashAsync(user.Id, ct);
        if (passwordHash == null || !BCrypt.Net.BCrypt.Verify(request.Password, passwordHash))
            return Unauthorized(ApiResponse<object>.ErrorResponse("Invalid email or password"));

        var token = _jwtService.GenerateToken(user.Id, user.UserName, user.Email);
        var response = new LoginResponse
        {
            UserId = user.Id,
            Username = user.UserName,
            Email = user.Email,
            Token = token,
            ExpiresAt = _jwtService.GetExpirationDate()
        };

        return Ok(ApiResponse<LoginResponse>.SuccessResponse(response, "Login successful"));
    }
}
