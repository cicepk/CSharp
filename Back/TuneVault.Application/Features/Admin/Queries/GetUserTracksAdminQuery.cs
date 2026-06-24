using MediatR;
using TuneVault.Domain.Entities;

namespace TuneVault.Application.Features.Admin.Queries;

public class GetUserTracksAdminQuery : IRequest<List<MediaItem>>
{
    public Guid UserId { get; set; }
}
