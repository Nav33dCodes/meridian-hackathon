# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Meridian is an enterprise urban heat intelligence platform: it ingests hyperlocal temperature data (FortyGuard API), stores it, analyzes risk, streams live updates to a dashboard, and uses Groq-hosted LLMs (via Semantic Kernel) as a conversational analysis/report-generation agent. Two-part repo: `backend/` (.NET 10 Clean Architecture Web API) and `frontend/` (Next.js 15).

## Standing Priority: Performance Everywhere

This project is explicitly optimized for speed end-to-end, not just feature completeness. Treat this as a default lens on every change, not a one-off task:

- **Database**: prefer indexed, filtered, paged queries over loading full tables into memory; watch `Meridian.Infrastructure/Repositories` and `AppDbContext` for N+1 query patterns (e.g. lazy-loading `Location` off every `HeatReading`); use `AsNoTracking()` for read-only queries; add EF Core migrations for any new index rather than relying on default PK-only indexing (see `Migrations/20260829090607_AddHeatReadingIndex.cs` for the existing precedent).
- **Backend API**: keep hot paths (dashboard, heat ingestion, SignalR broadcast) allocation-light and async all the way down; reuse the existing `HttpClient` + Polly retry pattern (`DependencyInjection.cs`) rather than instantiating new clients; be deliberate about what `LiveHeatSimulatorService`'s 2.5s tick and `HeatIngestionWorker`'s 15-min poll write to Postgres, since both feed the same hot table.
- **Frontend**: keep React Query as the cache of record and avoid triggering extra fetches outside it (see the `CommandPalette` `enabled: open` fix — its dashboard query used to fire on every route); keep heavy client-only libraries (Leaflet/map, charts) behind `dynamic(..., { ssr: false })`; avoid adding dependencies that aren't imported anywhere — audit with a grep before adding new UI/animation/form libraries.

When in doubt on a performance-sensitive change, profile or reason about the query plan / bundle impact before committing to an approach, and call out the tradeoff rather than silently picking one.

## Commands

### Backend (`backend/`)
```bash
cd backend/Meridian.API
dotnet run                       # starts API on http://localhost:5250 (https://localhost:7142); auto-applies EF migrations on startup
dotnet build ../Meridian.slnx    # build whole solution
dotnet ef migrations add <Name> -p ../Meridian.Infrastructure -s .   # add a migration (run from Meridian.API)
dotnet ef database update -p ../Meridian.Infrastructure -s .
```
There are no backend test projects in the solution currently — `Meridian.slnx` only lists API/Application/Core/Infrastructure.

Requires `backend/Meridian.API/appsettings.Development.json` (gitignored) with a real `ConnectionStrings:DefaultConnection` (Neon Postgres), `FortyGuard:ApiKey`, and `Groq:ApiKey`. Swagger UI is available at `/swagger` in Development.

### Frontend (`frontend/`)
```bash
cd frontend
npm run dev      # Next.js dev server on http://localhost:3000
npm run build
npm run lint
```
No test script/framework is configured in `package.json`. `.env.local` needs `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:5250`).

## Architecture

### Backend: Clean Architecture, 4 projects with a strict dependency direction
`Meridian.Core` (entities, interfaces, no dependencies) ← `Meridian.Application` (use-case services, AutoMapper mappings, DI registration) ← `Meridian.Infrastructure` (EF Core/Postgres, repositories, external HTTP clients) ← `Meridian.API` (controllers, SignalR hub, background services, PDF/Excel export). Each layer exposes an `AddApplication()` / `AddInfrastructure()` extension method (in that project's `DependencyInjection.cs`) that `Program.cs` composes.

- **Entities** (`Meridian.Core/Entities`): `Location` has many `HeatReading`s. `HeatReading` carries `TemperatureCelsius`, `HumidityPercent`, `HeatIndexCelsius`, `RiskLevel` (derived via `RiskLevelExtensions.FromTemperature`), and `MeasuredAt`.
- **Repositories** (`Meridian.Infrastructure/Repositories`): generic `Repository<T>` base plus `IHeatReadingRepository`/`ILocationRepository`/`IReportRepository` for query-specific methods (e.g. `GetActiveLocationsAsync`, `GetByLocationIdAsync`).
- **Result pattern**: `Meridian.Core.Common.Result` / `Result<T>` wrap success/failure instead of throwing for expected failure paths.
- **External integrations** (`Meridian.Infrastructure/External`):
  - `FortyGuardClient` (`ITemperatureService`) — typed `HttpClient` with Polly retry (3x, 500ms) for hyperlocal temperature data.
  - `GroqAgentService` (`IAgentService`) — uses **Microsoft Semantic Kernel**'s `AddOpenAIChatCompletion` pointed at Groq's OpenAI-compatible endpoint (`https://api.groq.com/openai/v1`), on a separate named `HttpClient("GroqClient")` with exponential-backoff Polly retry (handles 429s, 2-minute timeout). Three entry points: `AnalyzeHeatDataAsync` (one-shot), `StreamAnalysisAsync` (IAsyncEnumerable streaming for the chat agent), `GenerateReportAsync` (structured advisory report).
- **Two independent background services both write `HeatReading` rows** — know which one you're touching before changing ingestion logic:
  - `HeatIngestionWorker` (`Meridian.Application/Services`) — polls FortyGuard for all active locations every 15 minutes, this is the *real* data path.
  - `LiveHeatSimulatorService` (`Meridian.API/Services`) — fires every 2.5s, mutates a random location's last reading by ±1.5°C to keep the live dashboard visually active, then pushes it over SignalR. This is a demo/UI-liveliness feature, not real telemetry — check whether it should stay enabled before relying on data freshness/volume assumptions.
  - Both paths route through `IHeatNotificationService` / `HeatHub` (SignalR, `/hubs/heat`) to push updates; the simulator also broadcasts `ReceiveHeatReading` directly with a mapped `HeatReadingResponse`.
- **Controllers** (`Meridian.API/Controllers`, all `api/[controller]`): `HeatController` (readings, dashboard, ingest, history), `LocationController` (CRUD + bulk CSV-style ingestion), `AnalysisController` (correlations/trends), `AgentController` (`/query`, `/stream` — the Groq agent), `ReportController` (generate/list/delete), `ExportController` (`/excel` via ClosedXML, `/pdf` via QuestPDF + ScottPlot charts, see `Meridian.API/Exports`).
- CORS is locked to `http://localhost:3000` and `https://meridian.vercel.app` (`Program.cs`); rate limiting is a fixed 60 req/min window applied globally via `UseRateLimiter()`.

### Frontend: Next.js 15 App Router
- Routes under `src/app`: `/` (dashboard), `/agent` (chat with the Groq agent), `/analysis`, `/locations`, `/reports`.
- **Data flow**: React Query (`@tanstack/react-query`) is the source of truth for server state, with SignalR as a push channel that patches the query cache directly rather than triggering refetches. `useSignalR` (`src/hooks/useSignalR.ts`) connects to `/hubs/heat`, and on `ReceiveHeatReading` does a manual `queryClient.setQueryData(['dashboard'], ...)` merge (upsert by `locationId`, recompute `extremeRiskCount`/`highRiskCount`/`globalAverageTemp`) for zero-latency updates, then invalidates `['locations']`. `onreconnected` does a full invalidate as a catch-up-after-disconnect fallback. `QueryClient` defaults (`src/app/providers.tsx`) set `refetchOnWindowFocus: false` deliberately, since SignalR — not window focus — is the freshness mechanism.
- `useAppStore` (Zustand, `src/lib/store`) holds client-only UI state: selected location, current dashboard snapshot, and the agent chat transcript (`agentMessages`, `isAgentStreaming`) — server data itself stays in React Query, not here.
- `src/lib/api/client.ts` is a shared axios instance (`API_BASE` from `NEXT_PUBLIC_API_URL`) with a response interceptor normalizing backend errors to `err.response.data.error`.
- Mapping: Leaflet + `react-leaflet` + `leaflet.heat` for the heatmap layer (`components/HeatmapLayer.tsx`, `components/Map.tsx`) — the only mapping stack in use; Mapbox GL was an unused dependency and has been removed.
- Component layout: `components/ui` (generic primitives: Button, Card, Badge, RiskBadge, CommandPalette...), `components/shared` (Sidebar, GlobalAlerts, ThemeToggle), `components/features/*` (feature-specific, e.g. `features/dashboard`, `TimeLapseSlider`).
- **Design system**: flat, Vercel-inspired — neutral surfaces (`--bg-base`/`--bg-subtle`/`--bg-elevated`, solid, no blur/translucency), hairline borders (`--border-subtle`/`--border-default`) instead of shadows for separation, single accent (`--accent`, `#0070F3` light / `#3291FF` dark), tight radii (`rounded-md`=buttons/inputs, `rounded-lg`=cards). All tokens live in `src/app/globals.css` as CSS custom properties (`:root` / `.dark`), re-exposed to Tailwind v4 via the `@theme` block for opacity-modifier support (`bg-accent/10`, etc.) — change a token there rather than hardcoding colors in components. Semantic risk colors (`--risk-low/moderate/high/extreme`) are separate from the neutral/accent palette and shouldn't be touched when restyling.

## Notes
- Backend enums are serialized as strings over JSON (`JsonStringEnumConverter` added for both MVC and SignalR's JSON protocol) — keep frontend `RiskLevel` string unions in sync with `Meridian.Core.Common.RiskLevel`.
- DB migrations run automatically on API startup (`db.Database.MigrateAsync()` in `Program.cs`) — no separate migration step needed for local dev once the connection string is set.
