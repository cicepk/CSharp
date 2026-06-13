using MediatR;
using TuneVault.Application.DTOs.Share;

namespace TuneVault.Application.Features.Share.Queries
{
    public class GetShareInboxQuery : IRequest<IEnumerable<MediaShareDto>>
    {
        public Guid UserId { get; set; }
    }
}