using MediatR;
using TuneVault.Application.Interfaces;

namespace TuneVault.Application.Features.Admin.Commands;

public class DeleteUserByAdminHandler : IRequestHandler<DeleteUserByAdminCommand, bool>
{
    private readonly IUserRepository _userRepository;
    private readonly IMediaItemRepository _mediaItemRepository;
    private readonly IFileStorageService  _fileStorageService;

    public DeleteUserByAdminHandler(
        IUserRepository userRepository,
        IMediaItemRepository mediaItemRepository,
        IFileStorageService fileStorageService)
    {
        _userRepository      = userRepository;
        _mediaItemRepository = mediaItemRepository;
        _fileStorageService  = fileStorageService;
    }

    public async Task<bool> Handle(DeleteUserByAdminCommand command, CancellationToken cancellationToken)
    {
        var user = await _userRepository.GetByIdAsync(command.UserId, cancellationToken);
        if (user == null)
            throw new KeyNotFoundException("User not found");

        // xoa tung file supabase 
        var tracks = await _mediaItemRepository.GetByOwnerIdAsync(command.UserId, cancellationToken);
        foreach (var track in tracks)
        {
            await _fileStorageService.DeleteAsync(track.FilePath, cancellationToken);
            if (track.CoverPath != null)
                await _fileStorageService.DeleteAsync(track.CoverPath, cancellationToken);
        }

        // xoa user => xoa het media
        return await _userRepository.DeleteAsync(command.UserId, cancellationToken);
    }
}
