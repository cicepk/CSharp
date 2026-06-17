FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
WORKDIR /app
EXPOSE 10000

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY TuneVault.Domain/TuneVault.Domain.csproj           TuneVault.Domain/
COPY TuneVault.Application/TuneVault.Application.csproj TuneVault.Application/
COPY TuneVault.Infrastructure/TuneVault.Infrastructure.csproj TuneVault.Infrastructure/
COPY TuneVault.API/TuneVault.API.csproj                 TuneVault.API/
RUN dotnet restore TuneVault.API/TuneVault.API.csproj

COPY . .
RUN dotnet publish TuneVault.API/TuneVault.API.csproj -c Release -o /app/publish

# Copy schema.sql vào app directory để DataSeeder tìm thấy
COPY TuneVault.Infrastructure/Database/schema.sql /app/publish/schema.sql

FROM base AS final
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:10000

ENTRYPOINT ["dotnet", "TuneVault.API.dll"]
