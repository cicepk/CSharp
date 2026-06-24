using MediatR;
using TuneVault.Application.DTOs.Auth;
using TuneVault.Application.Interfaces;

namespace TuneVault.Application.Features.Auth.Commands;

public class LoginCommandHandler : IRequestHandler<LoginCommand, LoginResponse>
{
    private readonly IUserRepository _userRepository;
    private readonly IJwtService     _jwtService;
    private readonly IPasswordHasher _passwordHasher;

    public LoginCommandHandler(IUserRepository userRepository, IJwtService jwtService, IPasswordHasher passwordHasher)
    {
        _userRepository = userRepository;
        _jwtService     = jwtService;
        _passwordHasher = passwordHasher;
    }

    public async Task<LoginResponse> Handle(LoginCommand command, CancellationToken cancellationToken)
    {
        var user = await _userRepository.GetByEmailAsync(command.Email, cancellationToken);
        if (user == null)
            throw new KeyNotFoundException("Invalid email or password");

        var passwordHash = await _userRepository.GetPasswordHashAsync(user.Id, cancellationToken);
        if (passwordHash == null || !_passwordHasher.Verify(command.Password, passwordHash))
            throw new KeyNotFoundException("Invalid email or password");

        var role = user.Role.ToString();
        var token = _jwtService.GenerateToken(user.Id, user.UserName, user.Email, role);

        return new LoginResponse
        {
            UserId    = user.Id,
            Username  = user.UserName,
            Email     = user.Email,
            Token     = token,
            ExpiresAt = _jwtService.GetExpirationDate(),
            Role      = role
        };
    }
}
