# PageForge

Visual page builder — drag and drop components onto a WYSIWYG canvas, edit properties in real time, and export clean HTML+CSS or React+Tailwind code.

## Tech Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS + Zustand + @dnd-kit
- **Backend**: Go (Chi router) + PostgreSQL 16
- **Infrastructure**:
  - **Local dev**: Docker Compose + nginx reverse proxy
  - **Cloud deploy**: Cloudflare Pages (frontend) + Fly.io (Go backend + Postgres)

## Quick Start

```bash
# Prerequisites: Docker, Docker Compose, Go 1.22+, Node 20+

# Start everything (PostgreSQL, migrations, backend, nginx)
make dev

# Or run frontend + backend separately for development:
make dev-db              # Start PostgreSQL + run migrations
make dev-backend         # Start Go backend (port 8080)
make dev-frontend        # Start Vite dev server (port 5173)
```

## Canonical Frontend

**`frontend/` is the canonical UI for PageForge v1.** It is the only frontend wired into:
- `docker-compose.yml` (nginx serves the built assets)
- `Makefile` targets (`dev-frontend`, `build-frontend`, `test-frontend`, etc.)

The former experimental UI now lives under **`attic/web/`** (quarantined). It is **not** part of the supported build/test/deploy pipeline—use **`frontend/`** for product work.

## Project Structure

```
├── backend/
│   ├── cmd/pageforge/       # Entry point
│   ├── internal/
│   │   ├── handler/         # HTTP handlers (Chi)
│   │   ├── service/         # Business logic
│   │   ├── repository/      # Data access (PostgreSQL)
│   │   ├── model/           # Domain types
│   │   └── middleware/      # CORS, logging, request ID
│   └── migrations/          # SQL migrations (golang-migrate)
├── frontend/
│   └── src/                 # React + TypeScript application
├── attic/
│   └── web/                 # Quarantined legacy/experimental UI (not in pipeline)
├── nginx/                   # Reverse proxy config
├── docker-compose.yml       # Local development orchestration
├── Makefile                 # Build/test/deploy targets
└── api-spec.yaml            # OpenAPI 3.1 specification
```

## Available Commands

```bash
make help            # Show all available targets
make build           # Build backend + frontend
make test            # Run all tests
make lint            # Run all linters
make typecheck       # TypeScript type checking
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgres://pageforge:pageforge@localhost:5432/pageforge?sslmode=disable` | PostgreSQL connection |
| `PORT` | `8080` | Backend listen port |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed CORS origin |
| `LOG_LEVEL` | `info` | Log verbosity |
| `VITE_API_URL` | `http://localhost:8080/api/v1` | Frontend API base URL |

Copy `.env.example` to `.env` to override defaults.

## Deployment (Cloud)

- **Frontend**: Cloudflare Pages (build `frontend/`, deploy `frontend/dist`)
  - Set `VITE_API_URL` to `https://pageforge-api.fly.dev/api/v1`
- **Backend**: Fly.io (Go API + Postgres)
  - API host: `https://pageforge-api.fly.dev`

## API

See [api-spec.yaml](./api-spec.yaml) for the full OpenAPI specification.

Key endpoints:
- `GET /api/v1/health` — Health check
- `GET/POST /api/v1/projects` — List/create projects
- `GET/PUT/DELETE /api/v1/projects/:id` — Project CRUD
- `GET/POST /api/v1/projects/:id/pages` — List/create pages
- `GET/PUT/DELETE /api/v1/projects/:id/pages/:id` — Page CRUD with component tree
- `GET /api/v1/projects/:id/pages/:id/export?format=html|react` — Export page
