using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.StaticFiles;
using TuneVault.Application.DTOs.Common;
using TuneVault.Application.DTOs.Media;
using TuneVault.Application.Features.MediaItems.Commands;
using TuneVault.Application.Features.MediaItems.Queries;
using TuneVault.Application.Interfaces;

namespace TuneVault.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MediaItemsController : ControllerBase
{
    private readonly IMediator           _mediator;
    private readonly IFileStorageService _fileStorageService;
    private readonly IWebHostEnvironment _env;

    private static readonly string[] AllowedAudioExtensions = [".mp3", ".wav", ".flac", ".m4a"];
    private static readonly string[] AllowedVideoExtensions = [".mp4", ".webm", ".mkv"];
    private const long MaxFileSizeBytes = 500L * 1024 * 1024;
    private const long MinFileSizeBytes = 1L * 1024;

    public MediaItemsController(IMediator mediator, IFileStorageService fileStorageService, IWebHostEnvironment env)
    {
        _mediator           = mediator;
        _fileStorageService = fileStorageService;
        _env                = env;
    }

    private Guid   GetCurrentUserId() {
        var claim = User.FindFirst("userId") ?? User.FindFirst(ClaimTypes.NameIdentifier);
        return Guid.TryParse(claim?.Value, out var id) ? id : Guid.Empty;
    }

    private string BaseUrl => $"{Request.Scheme}://{Request.Host}";

    // GET /api/mediaitems
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        var result = await _mediator.Send(new GetAllMediaQuery { BaseUrl = BaseUrl }, ct);
        return Ok(ApiResponse<List<MediaDto>>.SuccessResponse(result));
    }

    // GET /api/mediaitems/{id}
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var result = await _mediator.Send(new GetMediaByIdQuery { Id = id, BaseUrl = BaseUrl }, ct);
        return Ok(ApiResponse<MediaDto>.SuccessResponse(result));
    }

    // POST /api/mediaitems/upload
    [HttpPost("upload")]
    [Authorize]
    [RequestSizeLimit(500 * 1024 * 1024)]
    public async Task<IActionResult> Upload(
        [FromForm] UploadMediaRequest request,
        IFormFile file,
        IFormFile? cover,
        CancellationToken ct)
    {
        // HTTP-boundary validation stays in controller
        var errors = new List<string>();
        if (string.IsNullOrWhiteSpace(request.Title))  errors.Add("Title is required");
        if (string.IsNullOrWhiteSpace(request.Artist)) errors.Add("Artist is required");
        if (request.MediaType != 1 && request.MediaType != 2)
            errors.Add("MediaType must be 1 (Audio) or 2 (Video)");

        if (file == null || file.Length == 0)
            errors.Add("File is required");
        else
        {
            if (file.Length < MinFileSizeBytes) errors.Add("File too small (min 1KB)");
            if (file.Length > MaxFileSizeBytes) errors.Add("File too large (max 500MB)");

            var ext    = Path.GetExtension(file.FileName).ToLowerInvariant();
            var isAudio = AllowedAudioExtensions.Contains(ext);
            var isVideo = AllowedVideoExtensions.Contains(ext);

            if (!isAudio && !isVideo)
                errors.Add($"Unsupported file type '{ext}'");
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

        // Save files via IFileStorageService
        var subFolder  = request.MediaType == 1 ? "audio" : "video";
        using var fileStream = file!.OpenReadStream();
        var filePath = await _fileStorageService.SaveAsync(fileStream, file.FileName, subFolder, ct);

        string? coverPath = null;
        if (cover != null && cover.Length > 0)
        {
            using var coverStream = cover.OpenReadStream();
            coverPath = await _fileStorageService.SaveAsync(coverStream, cover.FileName, "covers", ct);
        }

        var result = await _mediator.Send(new UploadMediaCommand
        {
            Title     = request.Title,
            Artist    = request.Artist,
            MediaType = request.MediaType,
            FilePath  = filePath,
            CoverPath = coverPath,
            OwnerId   = GetCurrentUserId(),
            BaseUrl   = BaseUrl
        }, ct);

        return CreatedAtAction(nameof(GetById), new { id = result.Id },
            ApiResponse<MediaDto>.SuccessResponse(result, "Upload successful"));
    }

    // GET /api/mediaitems/{id}/stream — Range streaming (HTTP concern stays here)
    [HttpGet("{id:guid}/stream")]
    public async Task<IActionResult> Stream(Guid id, CancellationToken ct)
    {
        var relativePath = await _mediator.Send(new GetMediaFilePathQuery { Id = id }, ct);
        if (relativePath == null)
            return NotFound(ApiResponse<object>.ErrorResponse("Media not found"));

        var wwwroot = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
        var physicalPath = Path.Combine(wwwroot, relativePath.TrimStart('/').Replace('/', Path.DirectorySeparatorChar));

        if (!System.IO.File.Exists(physicalPath))
            return NotFound(ApiResponse<object>.ErrorResponse("File not found on server"));

        var provider = new FileExtensionContentTypeProvider();
        if (!provider.TryGetContentType(physicalPath, out var contentType))
            contentType = "application/octet-stream";

        var fileInfo   = new FileInfo(physicalPath);
        var fileLength = fileInfo.Length;

        if (Request.Headers.TryGetValue("Range", out var rangeHeader))
        {
            var rangeValue = rangeHeader.ToString().Replace("bytes=", "");
            var rangeParts = rangeValue.Split('-');
            long start = long.TryParse(rangeParts[0], out var s) ? s : 0;
            long end   = rangeParts.Length > 1 && long.TryParse(rangeParts[1], out var e) ? e : fileLength - 1;

            if (end >= fileLength) end = fileLength - 1;
            var length = end - start + 1;

            Response.StatusCode = 206;
            Response.Headers.Append("Content-Range",  $"bytes {start}-{end}/{fileLength}");
            Response.Headers.Append("Accept-Ranges",  "bytes");
            Response.Headers.Append("Content-Length", length.ToString());
            Response.ContentType = contentType;

            using var fs = new FileStream(physicalPath, FileMode.Open, FileAccess.Read, FileShare.Read);
            fs.Seek(start, SeekOrigin.Begin);
            var buffer    = new byte[length];
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

    // PUT /api/mediaitems/{id}
    [HttpPut("{id:guid}")]
    [Authorize]
    public async Task<IActionResult> Update(Guid id, [FromBody] UploadMediaRequest request, CancellationToken ct)
    {
        var result = await _mediator.Send(new UpdateMediaCommand
        {
            Id            = id,
            CurrentUserId = GetCurrentUserId(),
            Title         = request.Title,
            Artist        = request.Artist,
            BaseUrl       = BaseUrl
        }, ct);

        return Ok(ApiResponse<MediaDto>.SuccessResponse(result, "Updated successfully"));
    }

    // DELETE /api/mediaitems/{id}
    [HttpDelete("{id:guid}")]
    [Authorize]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await _mediator.Send(new DeleteMediaCommand
        {
            Id            = id,
            CurrentUserId = GetCurrentUserId()
        }, ct);

        return NoContent();
    }

    // GET /api/mediaitems/search?q=
    [HttpGet("search")]
    public async Task<IActionResult> Search([FromQuery] string q, CancellationToken ct)
    {
        var result = await _mediator.Send(new SearchMediaQuery { Q = q, BaseUrl = BaseUrl }, ct);
        return Ok(ApiResponse<List<MediaDto>>.SuccessResponse(result, $"Found {result.Count} results"));
    }
}
