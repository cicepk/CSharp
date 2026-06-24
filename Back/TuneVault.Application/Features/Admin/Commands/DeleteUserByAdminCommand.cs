using MediatR;

namespace TuneVault.Application.Features.Admin.Commands;

public class DeleteUserByAdminCommand : IRequest<bool>
{
    public Guid UserId { get; set; }
}
