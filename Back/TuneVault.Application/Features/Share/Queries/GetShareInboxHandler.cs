using MediatR;
using TuneVault.Application.DTOs.Share;
using TuneVault.Application.Interfaces;

namespace TuneVault.Application.Features.Share.Queries;

public class GetShareInboxHandler : IRequestHandler<GetShareInboxQuery, IEnumerable<MediaShareDto>>
{
    private readonly IMediaShareRepository _shareRepository;

    public GetShareInboxHandler(IMediaShareRepository shareRepository)
    {
        _shareRepository = shareRepository;
    }

    public async Task<IEnumerable<MediaShareDto>> Handle(GetShareInboxQuery query, CancellationToken cancellationToken)
    {
        var shares = await _shareRepository.GetSharedWithMeAsync(query.UserId, cancellationToken);

        return shares.Select(s => new MediaShareDto
        {
            Id             = s.Id,
            MediaItemId    = s.MediaItemId,
            PlaylistId     = s.PlaylistId,
            SharedByUserId = s.SharedByUserId,
            SharedToUserId = s.SharedToUserId,
            SharedAt       = s.SharedAt
        });
    }
}
