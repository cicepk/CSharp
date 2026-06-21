using MediatR;
using TuneVault.Application.Interfaces;

namespace TuneVault.Application.Features.User.Commands;

public class UploadAvatarHandler : IRequestHandler<UploadAvatarCommand, string>
{
    private readonly IUserRepository     _userRepository;
    private readonly IFileStorageService _fileStorageService;

    public UploadAvatarHandler(IUserRepository userRepository, IFileStorageService fileStorageService)
    {
        _userRepository     = userRepository;
        _fileStorageService = fileStorageService;
    }

    public async Task<string> Handle(UploadAvatarCommand command, CancellationToken cancellationToken)
    {
        var user = await _userRepository.GetByIdAsync(command.UserId, cancellationToken);
        if (user == null)
            throw new KeyNotFoundException("User not found");

        await _fileStorageService.DeleteAsync(command.OldAvatarPath, cancellationToken);

        user.AvatarPath = command.NewAvatarPath;
        await _userRepository.UpdateAsync(user, cancellationToken);

        return command.NewAvatarPath;
    }
}
