using Microsoft.AspNetCore.Hosting;
using TuneVault.Application.Interfaces;

namespace TuneVault.Infrastructure.Services;

public class LocalFileStorageService : IFileStorageService
{
    private readonly IWebHostEnvironment _env;

    public LocalFileStorageService(IWebHostEnvironment env)
    {
        _env = env;
    }

    public async Task<string> SaveAsync(Stream fileStream, string fileName, string subFolder, CancellationToken ct = default)
    {
        var wwwroot = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
        var dir = Path.Combine(wwwroot, "uploads", subFolder);
        Directory.CreateDirectory(dir);

        var ext = Path.GetExtension(fileName).ToLowerInvariant();
        var uniqueName = $"{Guid.NewGuid()}{ext}";
        var fullPath = Path.Combine(dir, uniqueName);

        using var fs = new FileStream(fullPath, FileMode.Create);
        await fileStream.CopyToAsync(fs, ct);

        return $"/uploads/{subFolder}/{uniqueName}";
    }

    public void Delete(string? path)
    {
        if (string.IsNullOrWhiteSpace(path)) return;

        var wwwroot  = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
        var fullPath = Path.Combine(wwwroot, path.TrimStart('/').Replace('/', Path.DirectorySeparatorChar));

        if (File.Exists(fullPath))
            File.Delete(fullPath);
    }

    public Task DeleteAsync(string? path, CancellationToken ct = default)
    {
        Delete(path);
        return Task.CompletedTask;
    }
}
