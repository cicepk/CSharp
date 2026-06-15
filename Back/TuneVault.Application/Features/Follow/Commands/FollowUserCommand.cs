using MediatR;

namespace TuneVault.Application.Features.Follow.Commands;

public class FollowUserCommand : IRequest<bool>
{
    public Guid FollowerId   { get; set; }
    public Guid TargetUserId { get; set; }
}
