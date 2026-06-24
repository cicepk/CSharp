using MediatR;
using TuneVault.Application.Interfaces;

namespace TuneVault.Application.Features.Admin.Commands;

public class DeleteTrackByAdminHandler : IRequestHandler<DeleteTrackByAdminCommand, bool>
{
    private readonly IMediaItemRepository _mediaItemRepository;
    private readonly IFileStorageService _fileStorageService;

    public DeleteTrackByAdminHandler(IMediaItemRepository mediaItemRepository, IFileStorageService fileStorageService)
    {
        _mediaItemRepository = mediaItemRepository;
        _fileStorageService = fileStorageService;
    }

    public async Task<bool> Handle(DeleteTrackByAdminCommand command, CancellationToken cancellationToken)
    {
        var item = await _mediaItemRepository.GetByIdAsync(command.TrackId, cancellationToken);
        if (item == null)
            throw new KeyNotFoundException("Track not found");

        var filePath = item.FilePath;
        var coverPath = item.CoverPath;

        await _mediaItemRepository.DeleteAsync(command.TrackId, cancellationToken);

        await _fileStorageService.DeleteAsync(filePath, cancellationToken);
        if (coverPath != null)
            await _fileStorageService.DeleteAsync(coverPath, cancellationToken);

        return true;
    }
}
