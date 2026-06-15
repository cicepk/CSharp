using MediatR;

namespace TuneVault.Application.Features.MediaItems.Queries;

public class GetMediaFilePathQuery : IRequest<string?>
{
    public Guid Id { get; set; }
}
