using FluentValidation;
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

        services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(assembly));

        services.AddValidatorsFromAssembly(assembly);

        services.AddTransient(typeof(IPipelineBehavior<,>), typeof(ValidationBehaviour<,>));

        return services;
    }
}
