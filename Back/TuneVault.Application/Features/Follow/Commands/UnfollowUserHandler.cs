using MediatR;
using TuneVault.Application.Interfaces;

namespace TuneVault.Application.Features.Follow.Commands;

public class UnfollowUserHandler : IRequestHandler<UnfollowUserCommand, bool>
{
    private readonly IFollowRepository _followRepository;

    public UnfollowUserHandler(IFollowRepository followRepository)
    {
        _followRepository = followRepository;
    }

    public async Task<bool> Handle(UnfollowUserCommand command, CancellationToken cancellationToken)
    {
        if (command.FollowerId == command.TargetUserId)
            throw new ArgumentException("Cannot unfollow yourself");

        var unfollowed = await _followRepository.UnfollowAsync(command.FollowerId, command.TargetUserId, cancellationToken);
        if (!unfollowed)
            throw new KeyNotFoundException("You are not following this user");

        return true;
    }
}
