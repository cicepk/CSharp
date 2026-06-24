using MediatR;
using TuneVault.Application.DTOs.Admin;

namespace TuneVault.Application.Features.Admin.Queries;

public class GetAdminUsersQuery : IRequest<List<AdminUserDto>> { }
