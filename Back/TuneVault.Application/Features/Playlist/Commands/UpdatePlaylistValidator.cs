using FluentValidation;

namespace TuneVault.Application.Features.Playlist.Commands;

public class UpdatePlaylistValidator : AbstractValidator<UpdatePlaylistCommand>
{
    public UpdatePlaylistValidator()
    {
        RuleFor(x => x.Name).NotEmpty().WithMessage("Playlist name is required");
    }
}
