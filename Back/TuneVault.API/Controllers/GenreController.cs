using Microsoft.AspNetCore.Mvc;
using TuneVault.Application.Interfaces;

namespace TuneVault.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class GenreController : ControllerBase
{
    private readonly IMediaItemRepository _mediaItemRepository;

    public GenreController(IMediaItemRepository mediaItemRepository)
    {
        _mediaItemRepository = mediaItemRepository;
    }

    // GET /api/genre
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        var genres = await _mediaItemRepository.GetAllGenresAsync(ct);
        var result = genres.Select(g => new { g.Id, g.Name });
        return Ok(result);
    }
}
