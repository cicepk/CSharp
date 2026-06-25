using MediatR;
using TuneVault.Application.DTOs.Media;
using TuneVault.Application.Interfaces;
using TuneVault.Domain.Entities;

namespace TuneVault.Application.Features.MediaItems.Commands;

public class UploadMediaHandler : IRequestHandler<UploadMediaCommand, MediaDto>
{
    private readonly IMediaItemRepository _mediaItemRepository;
    private readonly IFileStorageService _fileStorageService;

    public UploadMediaHandler(IMediaItemRepository mediaItemRepository, IFileStorageService fileStorageService)
    {
        _mediaItemRepository = mediaItemRepository;
        _fileStorageService = fileStorageService;
    }

    public async Task<MediaDto> Handle(UploadMediaCommand command, CancellationToken cancellationToken)
    {
        var subFolder = command.MediaType == 1 ? "audio" : "video";
        var filePath = await _fileStorageService.SaveAsync(command.FileStream, command.FileName, subFolder, cancellationToken);

        string? coverPath = null;
        if (command.CoverStream != null && command.CoverFileName != null)
            coverPath = await _fileStorageService.SaveAsync(command.CoverStream, command.CoverFileName, "covers", cancellationToken);

        var mediaItem = new MediaItem
        {
            Id = Guid.NewGuid(),
            Title = command.Title.Trim(),
            Artist = command.Artist.Trim(),
            FilePath = filePath,
            CoverPath = coverPath,
            MediaType = (Domain.Enums.MediaType)command.MediaType,
            DurationSeconds = command.DurationSeconds,
            OwnerId = command.OwnerId,
            CreatedAt = DateTime.UtcNow
        };

        await _mediaItemRepository.AddAsync(mediaItem, cancellationToken);

        foreach (var genreId in command.GenreIds)
            await _mediaItemRepository.AddMediaGenreAsync(mediaItem.Id, genreId, cancellationToken);

        return new MediaDto
        {
            Id = mediaItem.Id,
            Title = mediaItem.Title,
            Artist = mediaItem.Artist,
            MediaType = (int)mediaItem.MediaType,
            DurationSeconds = mediaItem.DurationSeconds,
            OwnerId = mediaItem.OwnerId,
            FilePath = $"{command.BaseUrl}/api/mediaitems/{mediaItem.Id}/stream",
            CoverPath = mediaItem.CoverPath != null ? (mediaItem.CoverPath.StartsWith("http") ? mediaItem.CoverPath : $"{command.BaseUrl}{mediaItem.CoverPath}") : null,
            CreatedAt = mediaItem.CreatedAt
        };
    }
}
