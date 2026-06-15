using MediatR;
using TuneVault.Application.DTOs.User;
using TuneVault.Application.Interfaces;

namespace TuneVault.Application.Features.User.Queries;

public class SearchUsersHandler : IRequestHandler<SearchUsersQuery, List<UserSearchResultDto>>
{
    private readonly IUserRepository _userRepository;

    public SearchUsersHandler(IUserRepository userRepository)
    {
        _userRepository = userRepository;
    }

    public async Task<List<UserSearchResultDto>> Handle(SearchUsersQuery request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Q) || request.Q.Length < 2)
            return [];

        var users = await _userRepository.SearchAsync(request.Q.Trim(), limit: 10, cancellationToken);

        return users
            .Where(u => u.Id != request.CurrentUserId)
            .Select(u => new UserSearchResultDto
            {
                Id        = u.Id,
                Username  = u.UserName,
                AvatarUrl = u.AvatarPath != null ? $"{request.BaseUrl}{u.AvatarPath}" : null,
                Bio       = u.Bio
            })
            .ToList();
    }
}
