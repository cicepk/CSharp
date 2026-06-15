using MediatR;
using TuneVault.Application.Interfaces;

namespace TuneVault.Application.Features.Follow.Queries;

public class GetFollowStatusHandler : IRequestHandler<GetFollowStatusQuery, FollowStatusResult>
{
    private readonly IFollowRepository _followRepository;

    public GetFollowStatusHandler(IFollowRepository followRepository)
    {
        _followRepository = followRepository;
    }

    public async Task<FollowStatusResult> Handle(GetFollowStatusQuery request, CancellationToken cancellationToken)
    {
        var isFollowing    = await _followRepository.IsFollowingAsync(request.CurrentUserId, request.TargetUserId, cancellationToken);
        var followerCount  = await _followRepository.GetFollowerCountAsync(request.TargetUserId, cancellationToken);
        var followingCount = await _followRepository.GetFollowingCountAsync(request.TargetUserId, cancellationToken);

        return new FollowStatusResult(isFollowing, followerCount, followingCount);
    }
}
