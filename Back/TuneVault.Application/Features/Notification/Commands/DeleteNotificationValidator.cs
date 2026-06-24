using FluentValidation;

namespace TuneVault.Application.Features.Notification.Commands;

public class DeleteNotificationValidator : AbstractValidator<DeleteNotificationCommand>
{
    public DeleteNotificationValidator()
    {
        RuleFor(x => x.NotificationId)
            .NotEmpty().WithMessage("NotificationId is required");

        RuleFor(x => x.CurrentUserId)
            .NotEmpty().WithMessage("CurrentUserId is required");
    }
}
