using MediatR;
using TuneVault.Application.DTOs.Share;
using TuneVault.Application.Interfaces;

namespace TuneVault.Application.Features.Share.Queries
{
    public class GetShareSentHandler : IRequestHandler<GetShareSentQuery, IEnumerable<MediaShareDto>>
    {
        private readonly IMediaShareRepository _shareRepository;

        public GetShareSentHandler(IMediaShareRepository shareRepository)
        {
            _shareRepository = shareRepository;
        }

        public async Task<IEnumerable<MediaShareDto>> Handle(GetShareSentQuery query, CancellationToken cancellationToken)
        {
            var shares = await _shareRepository.GetSharedByMeAsync(query.UserId, cancellationToken);

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
}