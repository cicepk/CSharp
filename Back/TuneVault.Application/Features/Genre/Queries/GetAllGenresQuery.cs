using MediatR;
using TuneVault.Application.DTOs.Genre;

namespace TuneVault.Application.Features.Genre.Queries;

public class GetAllGenresQuery : IRequest<List<GenreDto>>
{
}
