using MediatR;
using TuneVault.Application.DTOs.Admin;

namespace TuneVault.Application.Features.Admin.Queries;

public class GetUserTracksAdminQuery : IRequest<List<AdminTrackDto>>
{
    public Guid UserId { get; set; }
    public string BaseUrl { get; set; } = string.Empty;
}
