using MediatR;
using TuneVault.Application.DTOs.Media;
using TuneVault.Application.Interfaces;
using TuneVault.Domain.Entities;

namespace TuneVault.Application.Features.MediaItems.Commands;

public class UploadMediaHandler : IRequestHandler<UploadMediaCommand, MediaDto>
{
    private readonly IMediaItemRepository _mediaItemRepository;

    public UploadMediaHandler(IMediaItemRepository mediaItemRepository)
    {
        _mediaItemRepository = mediaItemRepository;
    }

    public async Task<MediaDto> Handle(UploadMediaCommand command, CancellationToken cancellationToken)
    {
        var mediaItem = new MediaItem
        {
            Id              = Guid.NewGuid(),
            Title           = command.Title.Trim(),
            Artist          = command.Artist.Trim(),
            FilePath        = command.FilePath,
            CoverPath       = command.CoverPath,
            MediaType       = (Domain.Enums.MediaType)command.MediaType,
            DurationSeconds = 0,
            OwnerId         = command.OwnerId,
            CreatedAt       = DateTime.UtcNow
        };

        await _mediaItemRepository.AddAsync(mediaItem, cancellationToken);

        return new MediaDto
        {
            Id              = mediaItem.Id,
            Title           = mediaItem.Title,
            Artist          = mediaItem.Artist,
            MediaType       = (int)mediaItem.MediaType,
            DurationSeconds = mediaItem.DurationSeconds,
            OwnerId         = mediaItem.OwnerId,
            FilePath        = $"{command.BaseUrl}/api/mediaitems/{mediaItem.Id}/stream",
            CoverPath       = mediaItem.CoverPath != null ? (mediaItem.CoverPath.StartsWith("http") ? mediaItem.CoverPath : $"{command.BaseUrl}{mediaItem.CoverPath}") : null,
            CreatedAt       = mediaItem.CreatedAt
        };
    }
}
