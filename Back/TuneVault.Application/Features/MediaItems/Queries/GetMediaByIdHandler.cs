using MediatR;
using TuneVault.Application.DTOs.Media;
using TuneVault.Application.Interfaces;

namespace TuneVault.Application.Features.MediaItems.Queries;

public class GetMediaByIdHandler : IRequestHandler<GetMediaByIdQuery, MediaDto>
{
    private readonly IMediaItemRepository _mediaItemRepository;

    public GetMediaByIdHandler(IMediaItemRepository mediaItemRepository)
    {
        _mediaItemRepository = mediaItemRepository;
    }

    public async Task<MediaDto> Handle(GetMediaByIdQuery request, CancellationToken cancellationToken)
    {
        var item = await _mediaItemRepository.GetByIdAsync(request.Id, cancellationToken);
        if (item == null)
            throw new KeyNotFoundException("Media not found");

        return new MediaDto
        {
            Id              = item.Id,
            Title           = item.Title,
            Artist          = item.Artist,
            MediaType       = (int)item.MediaType,
            DurationSeconds = item.DurationSeconds,
            OwnerId         = item.OwnerId,
            FilePath        = $"{request.BaseUrl}/api/mediaitems/{item.Id}/stream",
            CoverPath       = item.CoverPath != null ? (item.CoverPath.StartsWith("http") ? item.CoverPath : $"{request.BaseUrl}{item.CoverPath}") : null,
            CreatedAt       = item.CreatedAt
        };
    }
}
