using TuneVault.Domain.Entities;

namespace TuneVault.Application.Interfaces;

public interface IFollowRepository
{
    // follow nguoi khac
    Task FollowAsync(Guid followerId, Guid followedId, CancellationToken cancellationToken = default);

    Task<bool> UnfollowAsync(Guid followerId, Guid followedId, CancellationToken cancellationToken = default);
    // lay dsach followers cua user
    Task<IReadOnlyList<UserProfile>> GetFollowersAsync(Guid userId, CancellationToken cancellationToken = default);
    // lay dsach following cua user
    Task<IReadOnlyList<UserProfile>> GetFollowingAsync(Guid userId, CancellationToken cancellationToken = default);

    Task<bool> IsFollowingAsync(Guid followerId, Guid followedId, CancellationToken cancellationToken = default);

    Task<int> GetFollowerCountAsync(Guid userId, CancellationToken cancellationToken = default);

    Task<int> GetFollowingCountAsync(Guid userId, CancellationToken cancellationToken = default);
}
