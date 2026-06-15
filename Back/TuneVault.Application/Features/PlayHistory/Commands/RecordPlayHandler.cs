using MediatR;
using TuneVault.Application.Interfaces;

namespace TuneVault.Application.Features.PlayHistory.Commands;

public class RecordPlayHandler : IRequestHandler<RecordPlayCommand, bool>
{
    private readonly IPlayHistoryRepository _historyRepository;
    private readonly IMediaItemRepository   _mediaItemRepository;

    public RecordPlayHandler(IPlayHistoryRepository historyRepository, IMediaItemRepository mediaItemRepository)
    {
        _historyRepository   = historyRepository;
        _mediaItemRepository = mediaItemRepository;
    }

    public async Task<bool> Handle(RecordPlayCommand command, CancellationToken cancellationToken)
    {
        var media = await _mediaItemRepository.GetByIdAsync(command.MediaItemId, cancellationToken);
        if (media == null)
            throw new KeyNotFoundException("Media not found");

        await _historyRepository.RecordAsync(command.UserId, command.MediaItemId, command.DurationSeconds, cancellationToken);
        return true;
    }
}
