using MediatR;
using System;
public class ShareMediaCommand : IRequest<Guid>
{
    public Guid  SenderId       { get; set; }
    public Guid  ReceiverUserId { get; set; }
    public Guid? MediaItemId    { get; set; }
    public Guid? PlaylistId     { get; set; }
}



public class GetShareInboxQuery : MediatR.IRequest<System.Collections.Generic.IEnumerable<TuneVault.Application.DTOs.Share.MediaShareDto>>
{
    public Guid UserId { get; set; }
}