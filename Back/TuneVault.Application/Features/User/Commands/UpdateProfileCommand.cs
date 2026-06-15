using MediatR;

namespace TuneVault.Application.Features.User.Commands;

public class UpdateProfileCommand : IRequest<object>
{
    public Guid    UserId   { get; set; }
    public string  Username { get; set; } = string.Empty;
    public string  Email    { get; set; } = string.Empty;
    public string? Bio      { get; set; }
}
