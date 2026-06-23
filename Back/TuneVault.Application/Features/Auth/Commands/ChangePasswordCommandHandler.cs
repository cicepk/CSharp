using MediatR;
using TuneVault.Application.Interfaces;

namespace TuneVault.Application.Features.Auth.Commands;

public class ChangePasswordCommandHandler : IRequestHandler<ChangePasswordCommand, bool>
{
    private readonly IUserRepository _userRepository;
    private readonly IPasswordHasher _passwordHasher;

    public ChangePasswordCommandHandler(IUserRepository userRepository, IPasswordHasher passwordHasher)
    {
        _userRepository = userRepository;
        _passwordHasher = passwordHasher;
    }

    public async Task<bool> Handle(ChangePasswordCommand command, CancellationToken cancellationToken)
    {
        var currentHash = await _userRepository.GetPasswordHashAsync(command.UserId, cancellationToken);
        if (currentHash == null || !_passwordHasher.Verify(command.CurrentPassword, currentHash))
            throw new UnauthorizedAccessException("Current password is incorrect");

        var newHash = _passwordHasher.Hash(command.NewPassword);
        return await _userRepository.UpdatePasswordHashAsync(command.UserId, newHash, cancellationToken);
    }
}
