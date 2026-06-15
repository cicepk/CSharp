using MediatR;

namespace TuneVault.Application.Features.Follow.Queries;

public record FollowStatusResult(bool IsFollowing, int FollowerCount, int FollowingCount);

public class GetFollowStatusQuery : IRequest<FollowStatusResult>
{
    public Guid CurrentUserId { get; set; }
    public Guid TargetUserId  { get; set; }
}
