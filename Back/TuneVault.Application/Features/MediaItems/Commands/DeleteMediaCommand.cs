using MediatR;

namespace TuneVault.Application.Features.MediaItems.Commands;

public class DeleteMediaCommand : IRequest<bool>
{
    public Guid Id            { get; set; }
    public Guid CurrentUserId { get; set; }
}
