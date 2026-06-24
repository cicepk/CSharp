using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Options;
using TuneVault.Application.Interfaces;

namespace TuneVault.Infrastructure.Services;

public class SupabaseFileStorageService : IFileStorageService
{
    private readonly IHttpClientFactory _httpFactory;
    private readonly SupabaseSettings   _settings;

    private static readonly string[] AudioExtensions = [".mp3", ".wav", ".flac", ".m4a", ".aac"];

    public SupabaseFileStorageService(IHttpClientFactory httpFactory, IOptions<SupabaseSettings> options)
    {
        _httpFactory = httpFactory;
        _settings    = options.Value;
    }

    public async Task<string> SaveAsync(Stream fileStream, string fileName, string subFolder, CancellationToken ct = default)
    {
        var ext        = Path.GetExtension(fileName).ToLowerInvariant();
        var uniqueName = $"{Guid.NewGuid()}{ext}";
        var objectPath = $"{subFolder}/{uniqueName}";

        var contentType = GetContentType(ext);

        using var client  = _httpFactory.CreateClient("supabase");
        using var content = new StreamContent(fileStream);
        content.Headers.ContentType = new MediaTypeHeaderValue(contentType);

        var request = new HttpRequestMessage(HttpMethod.Post,
            $"{_settings.Url}/storage/v1/object/{_settings.BucketName}/{objectPath}");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _settings.ServiceKey);
        request.Headers.Add("x-upsert", "true");
        request.Content = content;

        var response = await client.SendAsync(request, ct);
        response.EnsureSuccessStatusCode();

        return $"{_settings.Url}/storage/v1/object/public/{_settings.BucketName}/{objectPath}";
    }

    public async Task DeleteAsync(string? path, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(path)) return;

        var objectPath = ExtractObjectPath(path);
        if (objectPath == null) return;

        using var client = _httpFactory.CreateClient("supabase");

        var request = new HttpRequestMessage(HttpMethod.Delete,
            $"{_settings.Url}/storage/v1/object/{_settings.BucketName}");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _settings.ServiceKey);

        var body = JsonSerializer.Serialize(new { prefixes = new[] { objectPath } });
        request.Content = new StringContent(body, Encoding.UTF8, "application/json");

        await client.SendAsync(request, ct);
    }

    public void Delete(string? path) => DeleteAsync(path).GetAwaiter().GetResult();

    // Extract "audio/abc.mp3" từ full Supabase public URL
    private string? ExtractObjectPath(string path)
    {
        if (!path.StartsWith("http", StringComparison.OrdinalIgnoreCase)) return null;

        var marker = $"/object/public/{_settings.BucketName}/";
        var idx    = path.IndexOf(marker, StringComparison.OrdinalIgnoreCase);
        return idx < 0 ? null : path[(idx + marker.Length)..];
    }

    private static string GetContentType(string ext) => ext switch
    {
        ".mp4"  => "video/mp4",
        ".webm" => "video/webm",
        ".mkv"  => "video/x-matroska",
        ".mp3"  => "audio/mpeg",
        ".wav"  => "audio/wav",
        ".flac" => "audio/flac",
        ".m4a"  => "audio/mp4",
        ".aac"  => "audio/aac",
        ".jpg" or ".jpeg" => "image/jpeg",
        ".png"  => "image/png",
        ".webp" => "image/webp",
        _       => "application/octet-stream"
    };
}
