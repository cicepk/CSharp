using MediatR;
using TuneVault.Application.Interfaces;

namespace TuneVault.Application.Features.MediaItems.Queries;

public class GetMediaFilePathHandler : IRequestHandler<GetMediaFilePathQuery, string?>
{
    private readonly IMediaItemRepository _mediaItemRepository;

    public GetMediaFilePathHandler(IMediaItemRepository mediaItemRepository)
    {
        _mediaItemRepository = mediaItemRepository;
    }

    public async Task<string?> Handle(GetMediaFilePathQuery request, CancellationToken cancellationToken)
    {
        var item = await _mediaItemRepository.GetByIdAsync(request.Id, cancellationToken);
        return item?.FilePath;
    }
}
