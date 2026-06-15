using MediatR;
using TuneVault.Application.DTOs.Follow;

namespace TuneVault.Application.Features.Follow.Queries;

public class GetFollowersQuery : IRequest<List<FollowerDto>>
{
    public Guid UserId { get; set; }
}
