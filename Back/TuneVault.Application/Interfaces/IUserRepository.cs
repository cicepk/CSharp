using TuneVault.Domain.Entities;

namespace TuneVault.Application.Interfaces;

public interface IUserRepository
{
    Task<UserProfile?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<UserProfile?> GetByEmailAsync(string email, CancellationToken cancellationToken = default);

    Task<UserProfile?> GetByUsernameAsync(string username, CancellationToken cancellationToken = default);

    Task<Guid> CreateAsync(UserProfile user, string passwordHash, CancellationToken cancellationToken = default);

    Task<bool> UpdateAsync(UserProfile user, CancellationToken cancellationToken = default);

    Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
    // hash password de verify khi login
    Task<string?> GetPasswordHashAsync(Guid userId, CancellationToken cancellationToken = default);

    Task<bool> ExistsAsync(Guid userId, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<UserProfile>> SearchAsync(string query, int limit = 10, CancellationToken cancellationToken = default);
}
