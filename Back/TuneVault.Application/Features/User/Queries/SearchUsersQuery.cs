using MediatR;
using TuneVault.Application.DTOs.User;

namespace TuneVault.Application.Features.User.Queries;

public class SearchUsersQuery : IRequest<List<UserSearchResultDto>>
{
    public string Q             { get; set; } = string.Empty;
    public Guid   CurrentUserId { get; set; }
    public string BaseUrl       { get; set; } = string.Empty;
}
