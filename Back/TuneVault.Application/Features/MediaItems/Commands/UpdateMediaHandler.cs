using MediatR;
using TuneVault.Application.DTOs.Media;
using TuneVault.Application.Interfaces;

namespace TuneVault.Application.Features.MediaItems.Commands;

public class UpdateMediaHandler : IRequestHandler<UpdateMediaCommand, MediaDto>
{
    private readonly IMediaItemRepository _mediaItemRepository;

    public UpdateMediaHandler(IMediaItemRepository mediaItemRepository)
    {
        _mediaItemRepository = mediaItemRepository;
    }

    public async Task<MediaDto> Handle(UpdateMediaCommand command, CancellationToken cancellationToken)
    {
        var item = await _mediaItemRepository.GetByIdAsync(command.Id, cancellationToken);
        if (item == null)
            throw new KeyNotFoundException("Media not found");

        if (item.OwnerId != command.CurrentUserId)
            throw new UnauthorizedAccessException();

        item.Title  = command.Title;
        item.Artist = command.Artist;

        await _mediaItemRepository.UpdateAsync(item, cancellationToken);

        return new MediaDto
        {
            Id              = item.Id,
            Title           = item.Title,
            Artist          = item.Artist,
            MediaType       = (int)item.MediaType,
            DurationSeconds = item.DurationSeconds,
            OwnerId         = item.OwnerId,
            FilePath        = $"{command.BaseUrl}/api/mediaitems/{item.Id}/stream",
            CoverPath       = item.CoverPath != null ? $"{command.BaseUrl}{item.CoverPath}" : null,
            CreatedAt       = item.CreatedAt
        };
    }
}
