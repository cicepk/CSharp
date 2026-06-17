using MediatR;
using TuneVault.Application.Interfaces;

namespace TuneVault.Application.Features.Share.Commands;

public class DeleteShareHandler : IRequestHandler<DeleteShareCommand, bool>
{
    private readonly IMediaShareRepository _shareRepository;

    public DeleteShareHandler(IMediaShareRepository shareRepository)
    {
        _shareRepository = shareRepository;
    }

    public async Task<bool> Handle(DeleteShareCommand command, CancellationToken cancellationToken)
    {
        var share = await _shareRepository.GetByIdAsync(command.ShareId, cancellationToken);
        if (share == null)
            throw new KeyNotFoundException("Share not found");

        if (share.SharedByUserId != command.CurrentUserId && share.SharedToUserId != command.CurrentUserId)
            throw new UnauthorizedAccessException();

        await _shareRepository.DeleteAsync(command.ShareId, cancellationToken);
        return true;
    }
}
