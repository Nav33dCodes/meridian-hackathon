# Builds Meridian.API. Works as-is on Railway, Render, Fly, Azure Container Apps —
# anything that takes a Dockerfile. Build context is the repo root.

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Restore first so dependency layers cache between builds.
COPY backend/Meridian.Core/Meridian.Core.csproj              backend/Meridian.Core/
COPY backend/Meridian.Application/Meridian.Application.csproj backend/Meridian.Application/
COPY backend/Meridian.Infrastructure/Meridian.Infrastructure.csproj backend/Meridian.Infrastructure/
COPY backend/Meridian.API/Meridian.API.csproj                backend/Meridian.API/
RUN dotnet restore backend/Meridian.API/Meridian.API.csproj

COPY backend/ backend/
RUN dotnet publish backend/Meridian.API/Meridian.API.csproj \
    -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

# Program.cs reads this to trust X-Forwarded-* and skip the HTTPS redirect,
# since the platform terminates TLS in front of the container.
ENV DOTNET_RUNNING_IN_CONTAINER=true
ENV ASPNETCORE_ENVIRONMENT=Production

EXPOSE 8080

# Railway and Render both inject $PORT; fall back to 8080 for a plain `docker run`.
ENTRYPOINT ["sh", "-c", "ASPNETCORE_URLS=http://+:${PORT:-8080} exec dotnet Meridian.API.dll"]
