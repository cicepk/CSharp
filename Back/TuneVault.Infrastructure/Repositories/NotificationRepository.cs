using Dapper;
using TuneVault.Application.Interfaces;
using TuneVault.Domain.Entities;
using TuneVault.Infrastructure.Data;

namespace TuneVault.Infrastructure.Repositories;

public class NotificationRepository : INotificationRepository
{
    private readonly ISqlConnectionFactory _connectionFactory;

    public NotificationRepository(ISqlConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task<Guid> CreateAsync(Notification notification, CancellationToken cancellationToken = default)
    {
        const string sql = @"
            INSERT INTO Notifications (Id, UserId, Type, Message, IsRead, CreatedAt)
            VALUES (@Id, @UserId, @Type, @Message, @IsRead, @CreatedAt)";

        using (var connection = _connectionFactory.CreateConnection())
        {
            var parameters = new
            {
                notification.Id,
                notification.UserId,
                notification.Type,
                notification.Message,
                notification.IsRead,
                notification.CreatedAt
            };
            var command = new CommandDefinition(sql, parameters, cancellationToken: cancellationToken);
            await connection.ExecuteAsync(command);
            return notification.Id;
        }
    }

    public async Task<Notification?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        const string sql = @"
            SELECT Id, UserId, Type, Message, IsRead, CreatedAt
            FROM Notifications
            WHERE Id = @Id";

        using (var connection = _connectionFactory.CreateConnection())
        {
            var parameters = new { Id = id };
            var command = new CommandDefinition(sql, parameters, cancellationToken: cancellationToken);
            var notification = await connection.QuerySingleOrDefaultAsync<Notification>(command);
            return notification;
        }
    }

    public async Task<IReadOnlyList<Notification>> GetByUserIdAsync(Guid userId, bool unreadOnly = false, CancellationToken cancellationToken = default)
    {
        string sql = @"
            SELECT Id, UserId, Type, Message, IsRead, CreatedAt
            FROM Notifications
            WHERE UserId = @UserId";

        if (unreadOnly)
        {
            sql += " AND IsRead = 0";
        }

        sql += " ORDER BY CreatedAt DESC";

        using (var connection = _connectionFactory.CreateConnection())
        {
            var parameters = new { UserId = userId };
            var command = new CommandDefinition(sql, parameters, cancellationToken: cancellationToken);
            var notifications = await connection.QueryAsync<Notification>(command);
            return notifications.ToList();
        }
    }

    public async Task<bool> MarkAsReadAsync(Guid id, CancellationToken cancellationToken = default)
    {
        const string sql = @"
            UPDATE Notifications
            SET IsRead = 1
            WHERE Id = @Id";

        using (var connection = _connectionFactory.CreateConnection())
        {
            var parameters = new { Id = id };
            var command = new CommandDefinition(sql, parameters, cancellationToken: cancellationToken);
            var affectedRows = await connection.ExecuteAsync(command);
            return affectedRows > 0;
        }
    }

    public async Task<int> MarkAllAsReadAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        const string sql = @"
            UPDATE Notifications
            SET IsRead = 1
            WHERE UserId = @UserId AND IsRead = 0";

        using (var connection = _connectionFactory.CreateConnection())
        {
            var parameters = new { UserId = userId };
            var command = new CommandDefinition(sql, parameters, cancellationToken: cancellationToken);
            var affectedRows = await connection.ExecuteAsync(command);
            return affectedRows;
        }
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        const string sql = "DELETE FROM Notifications WHERE Id = @Id";

        using (var connection = _connectionFactory.CreateConnection())
        {
            var parameters = new { Id = id };
            var command = new CommandDefinition(sql, parameters, cancellationToken: cancellationToken);
            var affectedRows = await connection.ExecuteAsync(command);
            return affectedRows > 0;
        }
    }

    public async Task<int> GetUnreadCountAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        const string sql = @"
            SELECT COUNT(*)
            FROM Notifications
            WHERE UserId = @UserId AND IsRead = 0";

        using (var connection = _connectionFactory.CreateConnection())
        {
            var parameters = new { UserId = userId };
            var command = new CommandDefinition(sql, parameters, cancellationToken: cancellationToken);
            var count = await connection.QuerySingleAsync<int>(command);
            return count;
        }
    }
}
