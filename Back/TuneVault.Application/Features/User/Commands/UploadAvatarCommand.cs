using MediatR;

namespace TuneVault.Application.Features.User.Commands;

public class UploadAvatarCommand : IRequest<string>
{
    public Guid    UserId         { get; set; }
    public string  NewAvatarPath  { get; set; } = string.Empty;
    public string? OldAvatarPath  { get; set; }
}
