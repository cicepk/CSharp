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

        // Save the new avatar (name it by user id to keep one file per user)
        var fileName = $"{command.UserId}{Path.GetExtension(command.FileName)}";
        var newAvatarPath = await _fileStorageService.SaveAsync(command.FileStream, fileName, "avatars", cancellationToken);

        // Remove the previous avatar (read directly from the entity, no need to pass it in)
        await _fileStorageService.DeleteAsync(user.AvatarPath, cancellationToken);

        user.AvatarPath = newAvatarPath;
        await _userRepository.UpdateAsync(user, cancellationToken);

        return newAvatarPath;
    }
}
