using MediatR;
using TuneVault.Application.DTOs.Admin;
using TuneVault.Application.Interfaces;

namespace TuneVault.Application.Features.Admin.Queries;

public class GetAdminStatsHandler : IRequestHandler<GetAdminStatsQuery, AdminStatsDto>
{
    private readonly IUserRepository _userRepository;
    private readonly IMediaItemRepository _mediaItemRepository;

    public GetAdminStatsHandler(IUserRepository userRepository, IMediaItemRepository mediaItemRepository)
    {
        _userRepository = userRepository;
        _mediaItemRepository = mediaItemRepository;
    }

    public async Task<AdminStatsDto> Handle(GetAdminStatsQuery request, CancellationToken cancellationToken)
    {
        var totalUsers = await _userRepository.GetTotalUsersCountAsync(cancellationToken);
        var allTracks = await _mediaItemRepository.GetAllAsync(cancellationToken);

        return new AdminStatsDto
        {
            TotalUsers = totalUsers,
            TotalTracks = allTracks.Count
        };
    }
}
