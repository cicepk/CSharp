using MediatR;

namespace TuneVault.Application.Features.PlayHistory.Commands;

public class RecordPlayCommand : IRequest<bool>
{
    public Guid UserId          { get; set; }
    public Guid MediaItemId     { get; set; }
    public int  DurationSeconds { get; set; }
}
