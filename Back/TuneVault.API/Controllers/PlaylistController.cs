using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TuneVault.Application.DTOs.Common;
using TuneVault.Application.DTOs.Media;
using TuneVault.Application.DTOs.Playlist;
using TuneVault.Application.Interfaces;
using TuneVault.Domain.Entities;

namespace TuneVault.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PlaylistController : ControllerBase
{
    private readonly IPlaylistRepository _playlistRepo;
    private readonly IMediaItemRepository _mediaRepo;

    public PlaylistController(IPlaylistRepository playlistRepo, IMediaItemRepository mediaRepo)
    {
        _playlistRepo = playlistRepo;
        _mediaRepo = mediaRepo;
    }

    private Guid GetCurrentUserId()
    {
        var claim = User.FindFirst("userId") ?? User.FindFirst(ClaimTypes.NameIdentifier);
        return Guid.TryParse(claim?.Value, out var id) ? id : Guid.Empty;
    }

    private static PlaylistDto ToDto(Playlist p, int trackCount = 0, string? coverUrl = null) => new()
    {
        Id = p.Id,
        Name = p.Name,
        IsPublic = p.isPublic,
        OwnerId = p.OwnerId,
        TrackCount = trackCount,
        CoverUrl = coverUrl,
        CreatedAt = p.CreatedAt
    };

    // GET /api/playlist — Lấy playlists của user hiện tại
    [HttpGet]
    public async Task<IActionResult> GetMyPlaylists(CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        var playlists = await _playlistRepo.GetByUserIdAsync(userId, ct);
        var baseUrl = $"{Request.Scheme}://{Request.Host}";
        var dtos = new List<PlaylistDto>();
        foreach (var p in playlists)
        {
            var tracks = await _playlistRepo.GetPlaylistTracksAsync(p.Id, ct);
            var firstCover = tracks.FirstOrDefault()?.CoverPath;
            var coverUrl = firstCover != null ? $"{baseUrl}{firstCover}" : null;
            dtos.Add(ToDto(p, tracks.Count, coverUrl));
        }
        return Ok(ApiResponse<List<PlaylistDto>>.SuccessResponse(dtos));
    }

    // GET /api/playlist/{id} — Lấy chi tiết playlist + tracks
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var playlist = await _playlistRepo.GetByIdAsync(id, ct);
        if (playlist == null)
            return NotFound(ApiResponse<object>.ErrorResponse("Playlist not found"));

        var userId = GetCurrentUserId();
        if (!playlist.isPublic && playlist.OwnerId != userId)
            return Forbid();

        var tracks = await _playlistRepo.GetPlaylistTracksAsync(id, ct);
        var baseUrl = $"{Request.Scheme}://{Request.Host}";
        var trackDtos = tracks.Select(t => new MediaDto
        {
            Id = t.Id,
            Title = t.Title,
            Artist = t.Artist,
            MediaType = (int)t.MediaType,
            DurationSeconds = t.DurationSeconds,
            OwnerId = t.OwnerId,
            FilePath = $"{baseUrl}/api/mediaitems/{t.Id}/stream",
            CoverPath = t.CoverPath != null ? $"{baseUrl}{t.CoverPath}" : null,
            CreatedAt = t.CreatedAt
        }).ToList();

        var firstCover = tracks.FirstOrDefault()?.CoverPath;
        var detail = new PlaylistDetailDto
        {
            Id = playlist.Id,
            Name = playlist.Name,
            IsPublic = playlist.isPublic,
            OwnerId = playlist.OwnerId,
            TrackCount = tracks.Count,
            CoverUrl = firstCover != null ? $"{baseUrl}{firstCover}" : null,
            CreatedAt = playlist.CreatedAt,
            Tracks = trackDtos
        };

        return Ok(ApiResponse<PlaylistDetailDto>.SuccessResponse(detail));
    }

    // POST /api/playlist — Tạo playlist mới
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreatePlaylistRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(ApiResponse<object>.ErrorResponse("Name is required"));

        var userId = GetCurrentUserId();
        var playlist = new Playlist
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            isPublic = request.IsPublic,
            OwnerId = userId,
            CreatedAt = DateTime.UtcNow
        };

        var newId = await _playlistRepo.CreateAsync(playlist, ct);
        playlist.Id = newId;
        return CreatedAtAction(nameof(GetById), new { id = newId }, ApiResponse<PlaylistDto>.SuccessResponse(ToDto(playlist), "Playlist created"));
    }

    // PUT /api/playlist/{id} — Cập nhật playlist (chủ sở hữu)
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdatePlaylistRequest request, CancellationToken ct)
    {
        var playlist = await _playlistRepo.GetByIdAsync(id, ct);
        if (playlist == null)
            return NotFound(ApiResponse<object>.ErrorResponse("Playlist not found"));

        if (playlist.OwnerId != GetCurrentUserId())
            return Forbid();

        playlist.Name = request.Name;
        playlist.isPublic = request.IsPublic;

        await _playlistRepo.UpdateAsync(playlist, ct);
        return Ok(ApiResponse<PlaylistDto>.SuccessResponse(ToDto(playlist), "Updated successfully"));
    }

    // DELETE /api/playlist/{id} — Xóa playlist (chủ sở hữu)
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var playlist = await _playlistRepo.GetByIdAsync(id, ct);
        if (playlist == null)
            return NotFound(ApiResponse<object>.ErrorResponse("Playlist not found"));

        if (playlist.OwnerId != GetCurrentUserId())
            return Forbid();

        await _playlistRepo.DeleteAsync(id, ct);
        return NoContent();
    }

    // POST /api/playlist/{id}/tracks — Thêm track vào playlist
    [HttpPost("{id:guid}/tracks")]
    public async Task<IActionResult> AddTrack(Guid id, [FromBody] AddTrackToPlaylistRequest request, CancellationToken ct)
    {
        var playlist = await _playlistRepo.GetByIdAsync(id, ct);
        if (playlist == null)
            return NotFound(ApiResponse<object>.ErrorResponse("Playlist not found"));

        if (playlist.OwnerId != GetCurrentUserId())
            return Forbid();

        var media = await _mediaRepo.GetByIdAsync(request.MediaItemId, ct);
        if (media == null)
            return NotFound(ApiResponse<object>.ErrorResponse("Media item not found"));

        await _playlistRepo.AddTrackToPlaylistAsync(id, request.MediaItemId, ct);
        return Ok(ApiResponse<object>.SuccessResponse(null!, "Track added to playlist"));
    }

    // PATCH /api/playlist/{id}/visibility — Đổi public/private
    [HttpPatch("{id:guid}/visibility")]
    public async Task<IActionResult> ToggleVisibility(Guid id, [FromBody] ToggleVisibilityRequest request, CancellationToken ct)
    {
        var playlist = await _playlistRepo.GetByIdAsync(id, ct);
        if (playlist == null)
            return NotFound(ApiResponse<object>.ErrorResponse("Playlist not found"));

        if (playlist.OwnerId != GetCurrentUserId())
            return Forbid();

        playlist.isPublic = request.IsPublic;
        await _playlistRepo.UpdateAsync(playlist, ct);

        return Ok(ApiResponse<object>.SuccessResponse(new { isPublic = request.IsPublic }, "Visibility updated"));
    }

    // GET /api/playlist/user/{userId}/public — Playlists công khai của 1 user
    [HttpGet("user/{userId:guid}/public")]
    [AllowAnonymous]
    public async Task<IActionResult> GetPublicByUser(Guid userId, CancellationToken ct)
    {
        var baseUrl = $"{Request.Scheme}://{Request.Host}";
        var playlists = await _playlistRepo.GetPublicByUserIdAsync(userId, ct);
        var dtos = new List<PlaylistDto>();
        foreach (var p in playlists)
        {
            var tracks = await _playlistRepo.GetPlaylistTracksAsync(p.Id, ct);
            var firstCover = tracks.FirstOrDefault()?.CoverPath;
            var coverUrl = firstCover != null ? $"{baseUrl}{firstCover}" : null;
            dtos.Add(ToDto(p, tracks.Count, coverUrl));
        }
        return Ok(ApiResponse<List<PlaylistDto>>.SuccessResponse(dtos));
    }

    // DELETE /api/playlist/{id}/tracks/{mediaId} — Xóa track khỏi playlist
    [HttpDelete("{id:guid}/tracks/{mediaId:guid}")]
    public async Task<IActionResult> RemoveTrack(Guid id, Guid mediaId, CancellationToken ct)
    {
        var playlist = await _playlistRepo.GetByIdAsync(id, ct);
        if (playlist == null)
            return NotFound(ApiResponse<object>.ErrorResponse("Playlist not found"));

        if (playlist.OwnerId != GetCurrentUserId())
            return Forbid();

        var removed = await _playlistRepo.RemoveTrackFromPlaylistAsync(id, mediaId, ct);
        if (!removed)
            return NotFound(ApiResponse<object>.ErrorResponse("Track not in playlist"));

        return NoContent();
    }
}
