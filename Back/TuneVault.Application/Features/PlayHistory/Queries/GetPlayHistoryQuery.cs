using MediatR;
using TuneVault.Application.DTOs.PlayHistory;

namespace TuneVault.Application.Features.PlayHistory.Queries;

public class GetPlayHistoryQuery : IRequest<List<PlayHistoryDto>>
{
    public Guid   UserId  { get; set; }
    public string BaseUrl { get; set; } = string.Empty;
}
