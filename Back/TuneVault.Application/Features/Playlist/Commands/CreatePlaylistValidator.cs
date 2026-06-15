using FluentValidation;

namespace TuneVault.Application.Features.Playlist.Commands;

public class CreatePlaylistValidator : AbstractValidator<CreatePlaylistCommand>
{
    public CreatePlaylistValidator()
    {
        RuleFor(x => x.Name).NotEmpty().WithMessage("Playlist name is required");
    }
}
