namespace TuneVault.Application.Interfaces;

public interface IFileStorageService
{
    Task<string> SaveAsync(Stream fileStream, string fileName, string subFolder, CancellationToken ct = default);
    void Delete(string? relativePath);
}
