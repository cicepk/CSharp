using MediatR;

namespace TuneVault.Application.Features.Share.Commands;

public class DeleteShareCommand : IRequest<bool>
{
    public Guid ShareId { get; set; }
    public Guid CurrentUserId { get; set; }
}
