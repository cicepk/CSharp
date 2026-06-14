using MediatR;
using Microsoft.Extensions.DependencyInjection;
using TuneVault.Application.Behaviours;
using TuneVault.Application.DTOs.Share;

namespace TuneVault.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        var assembly = typeof(MediaShareDto).Assembly;

        // MediatR — scan toàn bộ handlers trong Application layer
        services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(assembly));

        // Pipeline: ValidationBehaviour chạy trước mọi MediatR Handler
        // Khi thêm Validator mới, chúng tự được inject vào IEnumerable<IValidator<TRequest>>
        services.AddTransient(typeof(IPipelineBehavior<,>), typeof(ValidationBehaviour<,>));

        return services;
    }
}
