using MediatR;
using TuneVault.Application.DTOs.Share;

namespace TuneVault.Application.Features.Share.Queries
{
    public class GetShareSentQuery : IRequest<IEnumerable<MediaShareDto>>
    {
        public Guid UserId { get; set; }
    }
}