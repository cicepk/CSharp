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
    private readonly IWebHostEnvironment _env;

    public MediaItemsController(IMediator mediator, IWebHostEnvironment env)
    {
        _mediator = mediator;
        _env      = env;
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

    // GET /api/mediaitems/my-uploads
    [HttpGet("my-uploads")]
    [Authorize]
    public async Task<IActionResult> GetMyUploads(CancellationToken ct)
    {
        var result = await _mediator.Send(new GetMyUploadsQuery
        {
            CurrentUserId = GetCurrentUserId(),
            BaseUrl       = BaseUrl
        }, ct);
        return Ok(ApiResponse<List<MediaDto>>.SuccessResponse(result));
    }

    // GET /api/mediaitems/recommendations
    [HttpGet("recommendations")]
    [Authorize]
    public async Task<IActionResult> GetRecommendations(CancellationToken ct)
    {
        var result = await _mediator.Send(new GetRecommendationsQuery
        {
            UserId  = GetCurrentUserId(),
            BaseUrl = BaseUrl
        }, ct);
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
        // Controller read stream + metadata from IFormFile and push command
        using var fileStream  = file is { Length: > 0 } ? file.OpenReadStream() : System.IO.Stream.Null;
        using var coverStream = cover is { Length: > 0 } ? cover.OpenReadStream() : null;

        var result = await _mediator.Send(new UploadMediaCommand
        {
            Title           = request.Title,
            Artist          = request.Artist,
            MediaType       = request.MediaType,
            FileStream      = fileStream,
            FileName        = file?.FileName ?? string.Empty,
            FileSizeBytes   = file?.Length ?? 0,
            CoverStream     = coverStream,
            CoverFileName   = cover is { Length: > 0 } ? cover.FileName : null,
            CoverSizeBytes  = cover?.Length ?? 0,
            OwnerId         = GetCurrentUserId(),
            BaseUrl         = BaseUrl,
            DurationSeconds = request.DurationSeconds,
            GenreIds        = request.GenreIds ?? new List<Guid>()
        }, ct);

        return CreatedAtAction(nameof(GetById), new { id = result.Id },
            ApiResponse<MediaDto>.SuccessResponse(result, "Upload successful"));
    }

    // GET /api/mediaitems/{id}/stream
    [HttpGet("{id:guid}/stream")]
    public async Task<IActionResult> Stream(Guid id, CancellationToken ct)
    {
        var filePath = await _mediator.Send(new GetMediaFilePathQuery { Id = id }, ct);
        if (filePath == null)
            return NotFound(ApiResponse<object>.ErrorResponse("Media not found"));

        if (filePath.StartsWith("http", StringComparison.OrdinalIgnoreCase))
            return Redirect(filePath);

        var wwwroot      = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
        var physicalPath = Path.Combine(wwwroot, filePath.TrimStart('/').Replace('/', Path.DirectorySeparatorChar));

        if (!System.IO.File.Exists(physicalPath))
            return NotFound(ApiResponse<object>.ErrorResponse("File not found on server"));

        var provider = new FileExtensionContentTypeProvider();
        if (!provider.TryGetContentType(physicalPath, out var contentType))
            contentType = "application/octet-stream";

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
