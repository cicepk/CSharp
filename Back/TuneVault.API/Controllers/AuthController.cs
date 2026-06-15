using MediatR;
using Microsoft.AspNetCore.Mvc;
using TuneVault.Application.DTOs.Auth;
using TuneVault.Application.DTOs.Common;
using TuneVault.Application.Features.Auth.Commands;

namespace TuneVault.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IMediator _mediator;

    public AuthController(IMediator mediator)
    {
        _mediator = mediator;
    }

    // POST /api/auth/register
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request, CancellationToken ct)
    {
        var result = await _mediator.Send(new RegisterCommand
        {
            Username = request.Username,
            Email    = request.Email,
            Password = request.Password
        }, ct);

        return CreatedAtAction(nameof(Register), ApiResponse<LoginResponse>.SuccessResponse(result, "Registration successful"));
    }

    // POST /api/auth/login
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request, CancellationToken ct)
    {
        var result = await _mediator.Send(new LoginCommand
        {
            Email    = request.Email,
            Password = request.Password
        }, ct);

        return Ok(ApiResponse<LoginResponse>.SuccessResponse(result, "Login successful"));
    }
}
