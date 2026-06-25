using MediatR;
using TuneVault.Application.DTOs.Genre;
using TuneVault.Application.Interfaces;

namespace TuneVault.Application.Features.Genre.Queries;

public class GetAllGenresHandler : IRequestHandler<GetAllGenresQuery, List<GenreDto>>
{
    private readonly IMediaItemRepository _mediaItemRepository;

    public GetAllGenresHandler(IMediaItemRepository mediaItemRepository)
    {
        _mediaItemRepository = mediaItemRepository;
    }

    public async Task<List<GenreDto>> Handle(GetAllGenresQuery request, CancellationToken cancellationToken)
    {
        var genres = await _mediaItemRepository.GetAllGenresAsync(cancellationToken);

        return genres.Select(g => new GenreDto
        {
            Id = g.Id,
            Name = g.Name
        }).ToList();
    }
}
