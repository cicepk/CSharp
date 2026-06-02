using Microsoft.AspNetCore.Mvc;
using TuneVault.Application.Interfaces;
using TuneVault.Domain.Entities;

namespace TuneVault.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MediaItemsController : ControllerBase
{
    private readonly IMediaItemRepository _repository;

    public MediaItemsController(IMediaItemRepository repository)
    {
        _repository = repository;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var items = await _repository.GetAllAsync();
        return Ok(items);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var item = await _repository.GetByIdAsync(id);
        if (item == null)
        {
            return NotFound();
        }

        return Ok(item);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] MediaItem mediaItem)
    {
        if (mediaItem == null)
        {
            return BadRequest();
        }

        await _repository.AddAsync(mediaItem);
        return CreatedAtAction(nameof(GetById), new { id = mediaItem.Id }, mediaItem);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] MediaItem mediaItem)
    {
        if (mediaItem == null)
        {
            return BadRequest();
        }

        // dam bao Id tren route khop voi ban ghi can cap nhat
        mediaItem.Id = id;

        var updated = await _repository.UpdateAsync(mediaItem);
        if (updated == false)
        {
            return NotFound();
        }

        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var deleted = await _repository.DeleteAsync(id);
        if (deleted == false)
        {
            return NotFound();
        }

        return NoContent();
    }
}
