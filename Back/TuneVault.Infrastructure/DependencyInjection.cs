using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using TuneVault.Application.Interfaces;
using TuneVault.Infrastructure.Data;
using TuneVault.Infrastructure.Repositories;
using TuneVault.Infrastructure.Seeders;
using TuneVault.Infrastructure.Services;

namespace TuneVault.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string 'DefaultConnection' is not configured");

        // Database connection factory (Dapper)
        services.AddSingleton<ISqlConnectionFactory>(new SqlConnectionFactory(connectionString));

        // Repositories
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IMediaItemRepository, MediaItemRepository>();
        services.AddScoped<IPlaylistRepository, PlaylistRepository>();
        services.AddScoped<IFavouriteRepository, FavouriteRepository>();
        services.AddScoped<IFollowRepository, FollowRepository>();
        services.AddScoped<IMediaShareRepository, MediaShareRepository>();
        services.AddScoped<INotificationRepository, NotificationRepository>();
        services.AddScoped<IPlayHistoryRepository, PlayHistoryRepository>();

        // Services
        services.AddScoped<IJwtService, JwtService>();
        services.AddScoped<IDataSeeder, DataSeeder>();

        return services;
    }
}
