using MediatR;
using TuneVault.Application.DTOs.User;
using TuneVault.Application.Interfaces;

namespace TuneVault.Application.Features.User.Queries;

public class GetUserByIdHandler : IRequestHandler<GetUserByIdQuery, UserDto>
{
    private readonly IUserRepository   _userRepository;
    private readonly IFollowRepository _followRepository;

    public GetUserByIdHandler(IUserRepository userRepository, IFollowRepository followRepository)
    {
        _userRepository   = userRepository;
        _followRepository = followRepository;
    }

    public async Task<UserDto> Handle(GetUserByIdQuery request, CancellationToken cancellationToken)
    {
        var user = await _userRepository.GetByIdAsync(request.UserId, cancellationToken);
        if (user == null)
            throw new KeyNotFoundException("User not found");

        var followerCount  = await _followRepository.GetFollowerCountAsync(request.UserId, cancellationToken);
        var followingCount = await _followRepository.GetFollowingCountAsync(request.UserId, cancellationToken);

        return new UserDto
        {
            Id             = user.Id,
            Username       = user.UserName,
            Bio            = user.Bio,
            AvatarUrl      = user.AvatarPath != null ? $"{request.BaseUrl}{user.AvatarPath}" : null,
            FollowerCount  = followerCount,
            FollowingCount = followingCount,
            CreatedAt      = user.CreatedAt
        };
    }
}
