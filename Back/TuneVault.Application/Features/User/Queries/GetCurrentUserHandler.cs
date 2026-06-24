using MediatR;
using TuneVault.Application.DTOs.User;
using TuneVault.Application.Interfaces;

namespace TuneVault.Application.Features.User.Queries;

public class GetCurrentUserHandler : IRequestHandler<GetCurrentUserQuery, UserDetailDto>
{
    private readonly IUserRepository   _userRepository;
    private readonly IFollowRepository _followRepository;

    public GetCurrentUserHandler(IUserRepository userRepository, IFollowRepository followRepository)
    {
        _userRepository   = userRepository;
        _followRepository = followRepository;
    }

    public async Task<UserDetailDto> Handle(GetCurrentUserQuery request, CancellationToken cancellationToken)
    {
        var user = await _userRepository.GetByIdAsync(request.UserId, cancellationToken);
        if (user == null)
            throw new KeyNotFoundException("User not found");

        var followerCount  = await _followRepository.GetFollowerCountAsync(request.UserId, cancellationToken);
        var followingCount = await _followRepository.GetFollowingCountAsync(request.UserId, cancellationToken);

        return new UserDetailDto
        {
            Id             = user.Id,
            Username       = user.UserName,
            Email          = user.Email,
            Bio            = user.Bio,
            AvatarUrl      = user.AvatarPath != null ? (user.AvatarPath.StartsWith("http") ? user.AvatarPath : $"{request.BaseUrl}{user.AvatarPath}") : null,
            FollowerCount  = followerCount,
            FollowingCount = followingCount,
            CreatedAt      = user.CreatedAt,
            Role           = user.Role.ToString()
        };
    }
}
