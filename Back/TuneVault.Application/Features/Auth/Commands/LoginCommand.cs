using MediatR;
using TuneVault.Application.DTOs.Auth;

namespace TuneVault.Application.Features.Auth.Commands;

public class LoginCommand : IRequest<LoginResponse>
{
    public string Email    { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}
