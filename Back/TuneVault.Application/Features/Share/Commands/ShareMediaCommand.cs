using MediatR;

namespace TuneVault.Application.Features.Share.Commands;

public class ShareMediaCommand : IRequest<Guid>
{
    public Guid  SenderId       { get; set; }
    public Guid  ReceiverUserId { get; set; }
    public Guid? MediaItemId    { get; set; }
    public Guid? PlaylistId     { get; set; }
}