using MediatR;
using TuneVault.Application.DTOs.Share;
using TuneVault.Application.Interfaces;

namespace TuneVault.Application.Features.Share.Queries;

public class GetShareSentHandler : IRequestHandler<GetShareSentQuery, IEnumerable<MediaShareDto>>
{
    private readonly IMediaShareRepository _shareRepository;
    private readonly IUserRepository _userRepository;

    public GetShareSentHandler(IMediaShareRepository shareRepository, IUserRepository userRepository)
    {
        _shareRepository = shareRepository;
        _userRepository  = userRepository;
    }

    public async Task<IEnumerable<MediaShareDto>> Handle(GetShareSentQuery query, CancellationToken cancellationToken)
    {
        var shares = await _shareRepository.GetSharedByMeAsync(query.UserId, cancellationToken);

        var usernameCache = new Dictionary<Guid, string>();
        async Task<string> ResolveUsernameAsync(Guid userId)
        {
            if (usernameCache.TryGetValue(userId, out var cached)) return cached;
            var user = await _userRepository.GetByIdAsync(userId, cancellationToken);
            var username = user?.UserName ?? string.Empty;
            usernameCache[userId] = username;
            return username;
        }

        var result = new List<MediaShareDto>();
        foreach (var s in shares)
        {
            result.Add(new MediaShareDto
            {
                Id               = s.Id,
                MediaItemId      = s.MediaItemId,
                PlaylistId       = s.PlaylistId,
                SharedByUserId   = s.SharedByUserId,
                SharedByUsername = await ResolveUsernameAsync(s.SharedByUserId),
                SharedToUserId   = s.SharedToUserId,
                SharedToUsername = await ResolveUsernameAsync(s.SharedToUserId),
                SharedAt         = s.SharedAt
            });
        }
        return result;
    }
}
