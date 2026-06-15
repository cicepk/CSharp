using MediatR;
using TuneVault.Application.DTOs.Follow;
using TuneVault.Application.Interfaces;

namespace TuneVault.Application.Features.Follow.Queries;

public class GetFollowingHandler : IRequestHandler<GetFollowingQuery, List<FollowerDto>>
{
    private readonly IFollowRepository _followRepository;
    private readonly IUserRepository   _userRepository;

    public GetFollowingHandler(IFollowRepository followRepository, IUserRepository userRepository)
    {
        _followRepository = followRepository;
        _userRepository   = userRepository;
    }

    public async Task<List<FollowerDto>> Handle(GetFollowingQuery request, CancellationToken cancellationToken)
    {
        var target = await _userRepository.GetByIdAsync(request.UserId, cancellationToken);
        if (target == null)
            throw new KeyNotFoundException("User not found");

        var following = await _followRepository.GetFollowingAsync(request.UserId, cancellationToken);
        return following.Select(u => new FollowerDto { Id = u.Id, Username = u.UserName }).ToList();
    }
}
