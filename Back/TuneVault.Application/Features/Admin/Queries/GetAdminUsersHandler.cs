using MediatR;
using TuneVault.Application.DTOs.Admin;
using TuneVault.Application.Interfaces;

namespace TuneVault.Application.Features.Admin.Queries;

public class GetAdminUsersHandler : IRequestHandler<GetAdminUsersQuery, List<AdminUserDto>>
{
    private readonly IUserRepository _userRepository;

    public GetAdminUsersHandler(IUserRepository userRepository)
    {
        _userRepository = userRepository;
    }

    public async Task<List<AdminUserDto>> Handle(GetAdminUsersQuery request, CancellationToken cancellationToken)
    {
        var users = await _userRepository.GetAllWithUploadCountAsync(cancellationToken);
        return users.ToList();
    }
}
