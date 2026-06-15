using MediatR;
using TuneVault.Application.Interfaces;

namespace TuneVault.Application.Features.MediaItems.Commands;

public class DeleteMediaHandler : IRequestHandler<DeleteMediaCommand, bool>
{
    private readonly IMediaItemRepository _mediaItemRepository;
    private readonly IFileStorageService  _fileStorageService;

    public DeleteMediaHandler(IMediaItemRepository mediaItemRepository, IFileStorageService fileStorageService)
    {
        _mediaItemRepository = mediaItemRepository;
        _fileStorageService  = fileStorageService;
    }

    public async Task<bool> Handle(DeleteMediaCommand command, CancellationToken cancellationToken)
    {
        var item = await _mediaItemRepository.GetByIdAsync(command.Id, cancellationToken);
        if (item == null)
            throw new KeyNotFoundException("Media not found");

        if (item.OwnerId != command.CurrentUserId)
            throw new UnauthorizedAccessException();

        var filePath  = item.FilePath;
        var coverPath = item.CoverPath;

        await _mediaItemRepository.DeleteAsync(command.Id, cancellationToken);

        _fileStorageService.Delete(filePath);
        _fileStorageService.Delete(coverPath);

        return true;
    }
}
