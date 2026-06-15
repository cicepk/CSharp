using MediatR;
using TuneVault.Application.Interfaces;

namespace TuneVault.Application.Features.MediaItems.Commands;

public class DeleteMediaHandler : IRequestHandler<DeleteMediaCommand, bool>
{
    private readonly IMediaItemRepository _mediaItemRepository;

    public DeleteMediaHandler(IMediaItemRepository mediaItemRepository)
    {
        _mediaItemRepository = mediaItemRepository;
    }

    public async Task<bool> Handle(DeleteMediaCommand command, CancellationToken cancellationToken)
    {
        var item = await _mediaItemRepository.GetByIdAsync(command.Id, cancellationToken);
        if (item == null)
            throw new KeyNotFoundException("Media not found");

        if (item.OwnerId != command.CurrentUserId)
            throw new UnauthorizedAccessException();

        await _mediaItemRepository.DeleteAsync(command.Id, cancellationToken);
        return true;
    }
}
