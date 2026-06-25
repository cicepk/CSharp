using FluentValidation;

namespace TuneVault.Application.Features.Follow.Commands;

public class UnfollowUserValidator : AbstractValidator<UnfollowUserCommand>
{
    public UnfollowUserValidator()
    {
        RuleFor(x => x.FollowerId)
            .NotEmpty().WithMessage("FollowerId is required");

        RuleFor(x => x.TargetUserId)
            .NotEmpty().WithMessage("TargetUserId is required")
            .NotEqual(x => x.FollowerId).WithMessage("FollowerId and TargetUserId must be different");
    }
}
