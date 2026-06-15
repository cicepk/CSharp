using MediatR;
using TuneVault.Application.DTOs.User;

namespace TuneVault.Application.Features.User.Queries;

public class GetCurrentUserQuery : IRequest<UserDetailDto>
{
    public Guid   UserId  { get; set; }
    public string BaseUrl { get; set; } = string.Empty;
}
