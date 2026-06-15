using MediatR;
using TuneVault.Application.DTOs.Auth;
using TuneVault.Application.Interfaces;
using TuneVault.Domain.Entities;

namespace TuneVault.Application.Features.Auth.Commands;

public class RegisterCommandHandler : IRequestHandler<RegisterCommand, LoginResponse>
{
    private readonly IUserRepository _userRepository;
    private readonly IJwtService     _jwtService;
    private readonly IPasswordHasher _passwordHasher;

    public RegisterCommandHandler(IUserRepository userRepository, IJwtService jwtService, IPasswordHasher passwordHasher)
    {
        _userRepository = userRepository;
        _jwtService     = jwtService;
        _passwordHasher = passwordHasher;
    }

    public async Task<LoginResponse> Handle(RegisterCommand command, CancellationToken cancellationToken)
    {
        var existingByEmail = await _userRepository.GetByEmailAsync(command.Email, cancellationToken);
        if (existingByEmail != null)
            throw new InvalidOperationException("Email already in use");

        var existingByUsername = await _userRepository.GetByUsernameAsync(command.Username, cancellationToken);
        if (existingByUsername != null)
            throw new InvalidOperationException("Username already taken");

        var passwordHash = _passwordHasher.Hash(command.Password);
        var user = new UserProfile
        {
            Id        = Guid.NewGuid(),
            UserName  = command.Username,
            Email     = command.Email,
            CreatedAt = DateTime.UtcNow
        };

        var userId = await _userRepository.CreateAsync(user, passwordHash, cancellationToken);
        var token  = _jwtService.GenerateToken(userId, command.Username, command.Email);

        return new LoginResponse
        {
            UserId    = userId,
            Username  = command.Username,
            Email     = command.Email,
            Token     = token,
            ExpiresAt = _jwtService.GetExpirationDate()
        };
    }
}
