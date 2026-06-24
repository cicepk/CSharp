using MediatR;

namespace TuneVault.Application.Features.Admin.Commands;

public class DeleteTrackByAdminCommand : IRequest<bool>
{
    public Guid TrackId { get; set; }
}
