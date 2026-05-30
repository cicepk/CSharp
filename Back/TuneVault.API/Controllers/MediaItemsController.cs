using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TuneVault.Application.Interfaces;
using TuneVault.Domain.Entities;

namespace TuneVault.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MediaItemsController : ControllerBase
{
    private readonly IApplicationDbContext _db;

    public MediaItemsController(IApplicationDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var items = await _db.MediaItems.ToListAsync();
        return Ok(items);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var item = await _db.MediaItems.FirstOrDefaultAsync(m => m.Id == id);
        if (item == null)
            return NotFound();

        return Ok(item);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] MediaItem mediaItem)
    {
        if (mediaItem == null)
            return BadRequest();

        await _db.MediaItems.AddAsync(mediaItem);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = mediaItem.Id }, mediaItem);
    }
}
