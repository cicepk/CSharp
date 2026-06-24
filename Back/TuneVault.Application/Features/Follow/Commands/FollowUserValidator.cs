using FluentValidation;

namespace TuneVault.Application.Features.Follow.Commands;

public class FollowUserValidator : AbstractValidator<FollowUserCommand>
{
    public FollowUserValidator()
    {
        RuleFor(x => x.FollowerId)
            .NotEmpty().WithMessage("FollowerId is required");

        RuleFor(x => x.TargetUserId)
            .NotEmpty().WithMessage("TargetUserId is required")
            .NotEqual(x => x.FollowerId).WithMessage("Không thể tự follow chính mình");
    }
}
