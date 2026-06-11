namespace TuneVault.Application.Interfaces;

public interface IDataSeeder
{
    Task SeedAsync();
    Task<bool> IsSeededAsync();
}
