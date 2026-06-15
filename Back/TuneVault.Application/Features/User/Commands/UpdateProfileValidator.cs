using FluentValidation;

namespace TuneVault.Application.Features.User.Commands;

public class UpdateProfileValidator : AbstractValidator<UpdateProfileCommand>
{
    public UpdateProfileValidator()
    {
        RuleFor(x => x.Username)
            .NotEmpty().WithMessage("Username is required")
            .MinimumLength(3).WithMessage("Username must be at least 3 characters");

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required")
            .EmailAddress().WithMessage("Invalid email format");

        RuleFor(x => x.Bio)
            .MaximumLength(300).WithMessage("Bio must be 300 characters or less")
            .When(x => x.Bio != null);
    }
}
