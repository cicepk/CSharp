using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.StaticFiles;
using TuneVault.Application.DTOs.Common;
using TuneVault.Application.DTOs.Media;
using TuneVault.Application.Interfaces;
using TuneVault.Domain.Entities;
using TuneVault.Domain.Enums;

namespace TuneVault.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MediaItemsController : ControllerBase
{
    private readonly IMediaItemRepository _mediaRepo;
    private readonly IWebHostEnvironment _env;
    private static readonly string[] AllowedAudioExtensions = [".mp3", ".wav", ".flac", ".m4a"];
    private static readonly string[] AllowedVideoExtensions = [".mp4", ".webm", ".mkv"];
    private const long MaxFileSizeBytes = 500L * 1024 * 1024; // 500MB
    private const long MinFileSizeBytes = 1L * 1024;           // 1KB

    public MediaItemsController(IMediaItemRepository mediaRepo, IWebHostEnvironment env)
    {
        _mediaRepo = mediaRepo;
        _env = env;
    }

    private Guid GetCurrentUserId()
    {
        var claim = User.FindFirst("userId") ?? User.FindFirst(ClaimTypes.NameIdentifier);
        return Guid.TryParse(claim?.Value, out var id) ? id : Guid.Empty;
    }

    private MediaDto ToDto(MediaItem item)
    {
        var baseUrl = $"{Request.Scheme}://{Request.Host}";
        return new MediaDto
        {
            Id = item.Id,
            Title = item.Title,
            Artist = item.Artist,
            MediaType = (int)item.MediaType,
            DurationSeconds = item.DurationSeconds,
            OwnerId = item.OwnerId,
            FilePath = $"{baseUrl}/api/mediaitems/{item.Id}/stream",
            CoverPath = item.CoverPath != null ? $"{baseUrl}{item.CoverPath}" : null,
            CreatedAt = item.CreatedAt
        };
    }

    // GET /api/mediaitems — Lấy tất cả media
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        var items = await _mediaRepo.GetAllAsync(ct);
        var dtos = items.Select(x => ToDto(x)).ToList();
        return Ok(ApiResponse<List<MediaDto>>.SuccessResponse(dtos));
    }

    // GET /api/mediaitems/{id}
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var item = await _mediaRepo.GetByIdAsync(id, ct);
        if (item == null)
            return NotFound(ApiResponse<object>.ErrorResponse("Media not found"));
        return Ok(ApiResponse<MediaDto>.SuccessResponse(ToDto(item)));
    }

    // POST /api/mediaitems/upload — Upload file (multipart/form-data)
    [HttpPost("upload")]
    [Authorize]
    [RequestSizeLimit(500 * 1024 * 1024)]
    public async Task<IActionResult> Upload(
        [FromForm] UploadMediaRequest request,
        IFormFile file,
        IFormFile? cover,
        CancellationToken ct)
    {
        var errors = new List<string>();
        if (string.IsNullOrWhiteSpace(request.Title)) errors.Add("Title is required");
        if (string.IsNullOrWhiteSpace(request.Artist)) errors.Add("Artist is required");
        if (request.MediaType != 1 && request.MediaType != 2) errors.Add("MediaType must be 1 (Audio) or 2 (Video)");

        if (file == null || file.Length == 0)
            errors.Add("File is required");
        else
        {
            if (file.Length < MinFileSizeBytes) errors.Add("File too small (min 1KB)");
            if (file.Length > MaxFileSizeBytes) errors.Add("File too large (max 500MB)");

            var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
            var isAudio = AllowedAudioExtensions.Contains(ext);
            var isVideo = AllowedVideoExtensions.Contains(ext);

            if (!isAudio && !isVideo)
                errors.Add($"Unsupported file type '{ext}'. Allowed: {string.Join(", ", AllowedAudioExtensions.Concat(AllowedVideoExtensions))}");
            else if (request.MediaType == 1 && !isAudio)
                errors.Add("File extension does not match Audio type");
            else if (request.MediaType == 2 && !isVideo)
                errors.Add("File extension does not match Video type");
        }

        string[] allowedCoverExts = [".jpg", ".jpeg", ".png", ".webp"];
        if (cover != null && cover.Length > 0)
        {
            var coverExt = Path.GetExtension(cover.FileName).ToLowerInvariant();
            if (!allowedCoverExts.Contains(coverExt))
                errors.Add("Cover must be JPG, PNG or WebP");
            if (cover.Length > 5L * 1024 * 1024)
                errors.Add("Cover image must be under 5MB");
        }

        if (errors.Count > 0)
            return BadRequest(ApiResponse<object>.ErrorResponse(errors.ToArray(), "Validation failed"));

        var wwwroot = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");

        // Save media file
        var subFolder = request.MediaType == 1 ? "audio" : "video";
        var mediaDir = Path.Combine(wwwroot, "uploads", subFolder);
        Directory.CreateDirectory(mediaDir);

        var mediaExt = Path.GetExtension(file!.FileName).ToLowerInvariant();
        var mediaFileName = $"{Guid.NewGuid()}{mediaExt}";
        using (var stream = new FileStream(Path.Combine(mediaDir, mediaFileName), FileMode.Create))
            await file.CopyToAsync(stream, ct);

        // Save cover image (optional)
        string? relativeCoverPath = null;
        if (cover != null && cover.Length > 0)
        {
            var coverDir = Path.Combine(wwwroot, "uploads", "covers");
            Directory.CreateDirectory(coverDir);
            var coverExt = Path.GetExtension(cover.FileName).ToLowerInvariant();
            var coverFileName = $"{Guid.NewGuid()}{coverExt}";
            using (var stream = new FileStream(Path.Combine(coverDir, coverFileName), FileMode.Create))
                await cover.CopyToAsync(stream, ct);
            relativeCoverPath = $"/uploads/covers/{coverFileName}";
        }

        var ownerId = GetCurrentUserId();
        var mediaItem = new MediaItem
        {
            Id = Guid.NewGuid(),
            Title = request.Title.Trim(),
            Artist = request.Artist.Trim(),
            FilePath = $"/uploads/{subFolder}/{mediaFileName}",
            CoverPath = relativeCoverPath,
            MediaType = (MediaType)request.MediaType,
            DurationSeconds = 0,
            OwnerId = ownerId,
            CreatedAt = DateTime.UtcNow
        };

        await _mediaRepo.AddAsync(mediaItem, ct);
        return CreatedAtAction(nameof(GetById), new { id = mediaItem.Id },
            ApiResponse<MediaDto>.SuccessResponse(ToDto(mediaItem), "Upload successful"));
    }

    // GET /api/mediaitems/{id}/stream — Stream audio/video với Range header support
    [HttpGet("{id:guid}/stream")]
    public async Task<IActionResult> Stream(Guid id, CancellationToken ct)
    {
        var item = await _mediaRepo.GetByIdAsync(id, ct);
        if (item == null)
            return NotFound(ApiResponse<object>.ErrorResponse("Media not found"));

        var physicalPath = Path.Combine(
            _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"),
            item.FilePath.TrimStart('/').Replace('/', Path.DirectorySeparatorChar));

        if (!System.IO.File.Exists(physicalPath))
            return NotFound(ApiResponse<object>.ErrorResponse("File not found on server"));

        var provider = new FileExtensionContentTypeProvider();
        if (!provider.TryGetContentType(physicalPath, out var contentType))
            contentType = "application/octet-stream";

        var fileInfo = new FileInfo(physicalPath);
        var fileLength = fileInfo.Length;

        // Range header support for video/audio streaming
        if (Request.Headers.TryGetValue("Range", out var rangeHeader))
        {
            var rangeValue = rangeHeader.ToString().Replace("bytes=", "");
            var rangeParts = rangeValue.Split('-');
            long start = long.TryParse(rangeParts[0], out var s) ? s : 0;
            long end = rangeParts.Length > 1 && long.TryParse(rangeParts[1], out var e) ? e : fileLength - 1;

            if (end >= fileLength) end = fileLength - 1;
            var length = end - start + 1;

            Response.StatusCode = 206;
            Response.Headers.Append("Content-Range", $"bytes {start}-{end}/{fileLength}");
            Response.Headers.Append("Accept-Ranges", "bytes");
            Response.Headers.Append("Content-Length", length.ToString());
            Response.ContentType = contentType;

            using var fs = new FileStream(physicalPath, FileMode.Open, FileAccess.Read, FileShare.Read);
            fs.Seek(start, SeekOrigin.Begin);
            var buffer = new byte[length];
            var totalRead = 0;
            while (totalRead < (int)length)
            {
                var read = await fs.ReadAsync(buffer.AsMemory(totalRead, (int)length - totalRead), ct);
                if (read == 0) break;
                totalRead += read;
            }
            return File(buffer, contentType);
        }

        Response.Headers.Append("Accept-Ranges", "bytes");
        return PhysicalFile(physicalPath, contentType, enableRangeProcessing: true);
    }

    // PUT /api/mediaitems/{id} — Cập nhật metadata (chủ sở hữu)
    [HttpPut("{id:guid}")]
    [Authorize]
    public async Task<IActionResult> Update(Guid id, [FromBody] UploadMediaRequest request, CancellationToken ct)
    {
        var item = await _mediaRepo.GetByIdAsync(id, ct);
        if (item == null)
            return NotFound(ApiResponse<object>.ErrorResponse("Media not found"));

        if (item.OwnerId != GetCurrentUserId())
            return Forbid();

        item.Title = request.Title;
        item.Artist = request.Artist;

        await _mediaRepo.UpdateAsync(item, ct);
        return Ok(ApiResponse<MediaDto>.SuccessResponse(ToDto(item), "Updated successfully"));
    }

    // DELETE /api/mediaitems/{id} — Xóa media (chủ sở hữu)
    [HttpDelete("{id:guid}")]
    [Authorize]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var item = await _mediaRepo.GetByIdAsync(id, ct);
        if (item == null)
            return NotFound(ApiResponse<object>.ErrorResponse("Media not found"));

        if (item.OwnerId != GetCurrentUserId())
            return Forbid();

        await _mediaRepo.DeleteAsync(id, ct);
        return NoContent();
    }

    // GET /api/mediaitems/search?q=keyword — Tìm kiếm media
    [HttpGet("search")]
    public async Task<IActionResult> Search([FromQuery] string q, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(q))
            return BadRequest(ApiResponse<object>.ErrorResponse("Search query is required"));

        var all = await _mediaRepo.GetAllAsync(ct);
        var lower = q.ToLowerInvariant();
        var results = all
            .Where(x => x.Title.ToLowerInvariant().Contains(lower) || x.Artist.ToLowerInvariant().Contains(lower))
            .Select(ToDto)
            .ToList();

        return Ok(ApiResponse<List<MediaDto>>.SuccessResponse(results, $"Found {results.Count} results"));
    }
}
