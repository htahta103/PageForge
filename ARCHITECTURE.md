# PageForge — System Architecture

## Overview

PageForge is a visual page builder that lets designers create web pages by
dragging and dropping components onto a WYSIWYG canvas, editing properties in
real time, and exporting clean HTML+CSS or React+Tailwind code.

## Technology Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Frontend framework | React 18 + TypeScript | Component model maps naturally to page-builder tree; strict types prevent prop/style bugs |
| Styling | Tailwind CSS | Utility-first — matches our export target; consistent spacing/color tokens |
| State management | Zustand | Lightweight, selector-based reactivity; built-in middleware for undo (temporal/immer) |
| Drag & drop | @dnd-kit | Tree-aware DnD with custom collision detection; supports both canvas drops and layer reordering |
| Backend | Go (Chi router) | Fast JSON marshalling for large component trees; simple deployment binary |
| Database | PostgreSQL 16 | JSONB for component trees; relational integrity for project/page hierarchy |
| Deployment | Local: Docker Compose; Cloud: Fly.io + Cloudflare Pages | Local is single-command dev; cloud uses Fly.io for the Go API + Postgres and Pages for the SPA |

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser (SPA)                            │
│                                                                 │
│  ┌──────────┐  ┌────────────┐  ┌──────────┐  ┌──────────────┐  │
│  │Component │  │   Canvas    │  │ Property │  │  Layer Tree   │  │
│  │ Palette  │  │ (DnD Zone) │  │  Panel   │  │  (DnD Sort)  │  │
│  └────┬─────┘  └─────┬──────┘  └────┬─────┘  └──────┬───────┘  │
│       │              │              │               │           │
│       └──────────────┴──────────────┴───────────────┘           │
│                          │                                      │
│                   ┌──────┴───────┐                               │
│                   │ Zustand Store │                               │
│                   │  + Temporal   │                               │
│                   └──────┬───────┘                               │
│                          │                                      │
│              ┌───────────┼───────────┐                           │
│              │           │           │                           │
│        ┌─────┴─────┐ ┌──┴───┐ ┌─────┴──────┐                    │
│        │ Component │ │Export│ │ API Client │                    │
│        │ Registry  │ │Engine│ │  (fetch)   │                    │
│        └───────────┘ └──────┘ └─────┬──────┘                    │
└─────────────────────────────────────┼───────────────────────────┘
                                      │ HTTP/JSON
                                      │
┌─────────────────────────────────────┼───────────────────────────┐
│                Go Backend           │                           │
│                                     │                           │
│  ┌────────────┐  ┌─────────────┐  ┌─┴──────────┐                │
│  │  Chi Router│──│  Handlers   │──│ Service    │                │
│  │  /api/v1/* │  │ (validate,  │  │ Layer      │                │
│  └────────────┘  │  serialize) │  └─────┬──────┘                │
│                  └─────────────┘        │                       │
│                                   ┌─────┴──────┐                │
│                                   │ Repository │                │
│                                   │  (sqlc)    │                │
│                                   └─────┬──────┘                │
│                                         │                       │
└─────────────────────────────────────────┼───────────────────────┘
                                          │ SQL
                                          │
                                   ┌──────┴──────┐
                                   │ PostgreSQL  │
                                   │  (JSONB)    │
                                   └─────────────┘
```

## Data Model

### Entity Relationships

```
Project 1──* Page 1──* Component (flat, tree via parentId)
   │
   └── Theme (JSONB, embedded in project row)
```

### Component (Stored Flat in JSONB Array)

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Unique identifier |
| type | enum | text, image, button, container, input, card, nav, list, icon, divider, spacer, video, custom-html |
| parentId | UUID? | null for root-level components |
| children | UUID[] | Ordered child IDs (containers only) |
| props | object | Content properties: text, src, href, alt, placeholder, etc. |
| styles.base | CSS object | Desktop-first base styles |
| styles.tablet | CSS object? | 768px breakpoint overrides |
| styles.mobile | CSS object? | 375px breakpoint overrides |
| meta.name | string | Layer display name |
| meta.locked | boolean | Prevents editing |
| meta.visible | boolean | Toggles canvas visibility |
| order | integer | Sibling sort order |

### Why Flat Storage

The component tree is stored as a flat array with `parentId` references rather
than nested JSON. This gives us:

1. **O(1) updates** — edit any component by ID without walking the tree
2. **Simple undo/redo** — immer patches on flat arrays are smaller and faster
3. **Efficient reordering** — change `parentId` + `order`, no subtree moves
4. **Tree derivation** — single-pass `groupBy(parentId)` to build tree for rendering

## Frontend Architecture

### Zustand Store Structure

```typescript
interface EditorStore {
  // Project data
  project: Project | null
  currentPageId: string | null

  // Component tree (flat)
  components: Record<string, Component>

  // UI state
  selectedIds: string[]
  hoveredId: string | null
  activeBreakpoint: 'desktop' | 'tablet' | 'mobile'
  clipboard: Component[] | null

  // Actions
  addComponent(type: ComponentType, parentId: string | null, index: number): void
  updateComponent(id: string, patch: Partial<Component>): void
  moveComponent(id: string, newParentId: string | null, index: number): void
  deleteComponent(id: string): void
  // ... selection, page, project actions
}
```

Undo/redo is provided by `zundo` (Zustand temporal middleware) which records
immer patches. This meets the <16ms NFR — patches are small diffs, not full
snapshots.

### Component Registry

Each component type is registered once:

```typescript
interface ComponentRegistration {
  type: ComponentType
  label: string
  icon: ReactNode
  defaultProps: Record<string, any>
  defaultStyles: CSSProperties
  schema: PropSchema[]           // Drives property panel UI
  render: React.FC<RenderProps>  // Canvas renderer
  exportHTML: (component: Component) => string
  exportReact: (component: Component) => string
}
```

New component types (P2/P3 stories) are added by registering new entries —
no changes to core canvas, property panel, or export logic.

### Drag & Drop Architecture

Two independent DnD contexts using @dnd-kit:

1. **Canvas DnD** — palette → canvas drops, component repositioning
   - `DndContext` wraps the canvas area
   - Custom `closestCenter` collision detection handles nested containers
   - Drop validation prevents invalid nesting (e.g., Input inside Input)

2. **Layer Tree DnD** — `SortableContext` for reordering and reparenting
   - Uses @dnd-kit/sortable for vertical list DnD
   - Indentation-based reparenting (drag left/right to change parent)

### Responsive Style Resolution

```
Resolved styles = base (desktop) ← merge ← breakpoint overrides
```

- Canvas: JS-level merge based on `activeBreakpoint` from store
- Export: CSS `@media` queries for tablet (max-width: 1279px) and
  mobile (max-width: 767px)

### Export Pipeline

```
Component Tree → Tree Walker → Per-Component Generator → Assembler → Output
                                       │
                          ┌─────────────┼──────────────┐
                          │             │              │
                     HTML+CSS      React+Tailwind   (future)
```

Both generators share the recursive tree walker. The walker calls
`registry[type].exportHTML()` or `registry[type].exportReact()` per node
and the assembler wraps the output in a complete document/component file.

## Backend Architecture

### Layer Structure

```
cmd/pageforge/main.go          Entry point
internal/
  handler/                     HTTP handlers (Chi)
    project.go
    page.go
    export.go
    health.go
  service/                     Business logic
    project.go
    page.go
  repository/                  Data access (sqlc-generated)
    project.go
    page.go
    queries/                   SQL query files
  model/                       Domain types
    project.go
    page.go
    component.go
  middleware/                   CORS, logging, request ID
migrations/                    SQL migration files (golang-migrate)
```

### API Design Principles

- RESTful resource hierarchy: `/api/v1/projects/:projectId/pages/:pageId`
- Component trees travel as part of Page payloads (JSONB) — no separate
  component endpoints needed
- JSON request/response with proper status codes and error bodies
- CORS configured for frontend dev server origin
- Request ID middleware for tracing

### Persistence Strategy

- **Projects and Pages** are relational rows with JSONB columns for the
  component tree and theme
- **Component trees** stored as JSONB array on the `pages` table — the
  entire flat component list serializes/deserializes as one column
- This avoids N+1 queries and complex joins — one read loads the full page
- **Save latency <500ms** achieved by writing a single JSONB column

## Deployment Topology

### Local Development (Docker Compose)

```
docker-compose.yml
├── nginx          (reverse proxy, serves SPA static files)
│   ├── :80  → frontend static assets
│   └── /api → go-backend:8080
├── go-backend     (Go binary)
│   └── :8080 (internal)
├── postgres       (PostgreSQL 16)
│   └── :5432 (internal, volume-mounted)
└── migrate        (one-shot: runs golang-migrate on startup)
```

### Cloud Deployment (Fly.io + Cloudflare Pages)

- **Backend**: Fly.io runs the Go API and connects to Postgres.
  - API host: `https://pageforge-api.fly.dev`
  - API routes: `/api/v1/*`
- **Frontend**: Cloudflare Pages hosts the built SPA from `frontend/dist`.
  - Configure the frontend API base to `https://pageforge-api.fly.dev/api/v1` (via `VITE_API_URL`)

### Environment Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| DATABASE_URL | postgres://pageforge:pageforge@postgres:5432/pageforge?sslmode=disable | PostgreSQL connection string |
| PORT | 8080 | Backend listen port |
| CORS_ORIGIN | http://localhost:5173 | Allowed CORS origin |
| LOG_LEVEL | info | Logging verbosity |

## Performance Considerations

| Requirement | Strategy |
|-------------|----------|
| 500+ components without lag | Flat store + React.memo on component renderers + virtualized layer tree |
| Save < 500ms | Single JSONB column write; debounced auto-save (2s) |
| Undo/Redo < 16ms | Immer patches via zundo; no full-state cloning |
| Initial load < 3s | Code splitting (canvas, property panel, export); lazy-load component registry entries |

## Security

- No auth in v1 (single-user local tool) — designed for future addition
  via middleware (JWT/session)
- Input validation on all API endpoints (component type enum, UUID format)
- JSONB size limit on page saves (10MB) to prevent abuse
- CORS restricted to configured origin
- SQL injection prevention via parameterized queries (sqlc)
