namespace TuneVault.Application.Interfaces;

public interface IJwtService
{
    string GenerateToken(Guid userId, string username, string email);
    DateTime GetExpirationDate();
}
