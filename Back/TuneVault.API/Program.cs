using TuneVault.Application.Interfaces;
using TuneVault.Infrastructure.Data;
using TuneVault.Infrastructure.Repositories;

var builder = WebApplication.CreateBuilder(args);

// doc chuoi ket noi tu appsettings.json
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

// factory tao ket noi dung chung cho moi repository
builder.Services.AddSingleton<ISqlConnectionFactory>(
    new SqlConnectionFactory(connectionString!));
builder.Services.AddScoped<IMediaItemRepository, MediaItemRepository>();

builder.Services.AddControllers();
builder.Services.AddOpenApi();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();
app.MapControllers();

app.Run();
