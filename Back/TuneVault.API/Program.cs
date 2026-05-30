using Microsoft.EntityFrameworkCore;
using TuneVault.Application.Interfaces;
using TuneVault.Infrastructure.Data;

var builder = WebApplication.CreateBuilder(args);

// doc chuoi ket noi tu appsettings.json
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

// khoi tao dbcontext voi chuoi ket noi
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(connectionString));

builder.Services.AddScoped<IApplicationDbContext>(provider =>
    provider.GetRequiredService<ApplicationDbContext>());

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