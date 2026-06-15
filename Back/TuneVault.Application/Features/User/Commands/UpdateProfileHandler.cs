using MediatR;
using TuneVault.Application.Interfaces;

namespace TuneVault.Application.Features.User.Commands;

public class UpdateProfileHandler : IRequestHandler<UpdateProfileCommand, object>
{
    private readonly IUserRepository _userRepository;

    public UpdateProfileHandler(IUserRepository userRepository)
    {
        _userRepository = userRepository;
    }

    public async Task<object> Handle(UpdateProfileCommand command, CancellationToken cancellationToken)
    {
        var user = await _userRepository.GetByIdAsync(command.UserId, cancellationToken);
        if (user == null)
            throw new KeyNotFoundException("User not found");

        if (user.UserName != command.Username)
        {
            var existing = await _userRepository.GetByUsernameAsync(command.Username, cancellationToken);
            if (existing != null)
                throw new InvalidOperationException("Username already taken");
        }

        if (user.Email != command.Email)
        {
            var existing = await _userRepository.GetByEmailAsync(command.Email, cancellationToken);
            if (existing != null)
                throw new InvalidOperationException("Email already in use");
        }

        user.UserName = command.Username;
        user.Email    = command.Email;
        user.Bio      = command.Bio;

        await _userRepository.UpdateAsync(user, cancellationToken);

        return new
        {
            userId   = command.UserId,
            username = command.Username,
            email    = command.Email,
            bio      = command.Bio
        };
    }
}
