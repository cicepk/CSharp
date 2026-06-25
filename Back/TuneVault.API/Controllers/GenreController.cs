using MediatR;
using Microsoft.AspNetCore.Mvc;
using TuneVault.Application.DTOs.Common;
using TuneVault.Application.DTOs.Genre;
using TuneVault.Application.Features.Genre.Queries;

namespace TuneVault.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class GenreController : ControllerBase
{
    private readonly IMediator _mediator;

    public GenreController(IMediator mediator)
    {
        _mediator = mediator;
    }

    // GET /api/genre
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        var result = await _mediator.Send(new GetAllGenresQuery(), ct);
        return Ok(ApiResponse<List<GenreDto>>.SuccessResponse(result));
    }
}
