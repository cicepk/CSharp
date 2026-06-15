using MediatR;
using TuneVault.Application.DTOs.User;

namespace TuneVault.Application.Features.User.Queries;

public class GetUserByIdQuery : IRequest<UserDto>
{
    public Guid   UserId  { get; set; }
    public string BaseUrl { get; set; } = string.Empty;
}
