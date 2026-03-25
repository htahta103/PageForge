# PageForge — Architecture Requirements

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend framework | React 18 + TypeScript |
| Styling | Tailwind CSS |
| State management | Zustand |
| Drag and drop | @dnd-kit |
| Backend | Go (Chi router) |
| Database | PostgreSQL |
| Deployment | Docker Compose |

## Core Domain Entities

### Component
The central entity. Represents a visual element on the canvas.

```
Component {
  id: string (uuid)
  type: ComponentType (text | image | button | container | input | card | nav | list | icon | divider | spacer | video | custom-html)
  parentId: string | null        // null = root-level on page
  children: string[]             // ordered child component IDs (for containers)
  props: Record<string, any>     // content properties (text, src, href, alt, placeholder, etc.)
  styles: {
    base: CSSProperties          // desktop-first base styles
    tablet?: CSSProperties       // 768px override
    mobile?: CSSProperties       // 375px override
  }
  meta: {
    name: string                 // layer display name
    locked: boolean
    visible: boolean
  }
  order: number                  // sibling sort order
}
```

### Page
A single page within a project. Contains a component tree.

```
Page {
  id: string (uuid)
  projectId: string
  name: string
  slug: string
  components: Component[]        // flat list, tree derived from parentId
  order: number                  // page sort order
}
```

### Project
Top-level container. Owns pages and theme.

```
Project {
  id: string (uuid)
  name: string
  theme: Theme
  createdAt: timestamp
  updatedAt: timestamp
}
```

### Theme
Project-level design tokens.

```
Theme {
  colors: Record<string, string>   // primary, secondary, accent, neutrals
  fonts: { heading: string, body: string }
  spacing: number                  // base unit (e.g., 4px)
}
```

### Entity Relationships

```
Project 1──* Page 1──* Component
   │                      │
   └── Theme              └── parent/children (self-referential tree)
```

## Key User Flows

### 1. Build a Page (Critical Path)
1. User creates/opens a project
2. Selects a page (or creates one)
3. Drags components from palette onto canvas
4. Selects component → property panel opens
5. Edits content, layout, typography, background, border, effects
6. Repeats 3-5 to build full page
7. Saves project (auto-save or manual)

### 2. Responsive Design
1. User designs at desktop breakpoint (default)
2. Switches to tablet (768px) breakpoint
3. Adjusts layout/styles — overrides stored per-breakpoint
4. Switches to mobile (375px) and repeats
5. Previews at each breakpoint

### 3. Export
1. User clicks Export
2. Chooses format: HTML+CSS or React+Tailwind
3. System traverses component tree, generates code
4. User previews in new tab or downloads ZIP

### 4. Organize with Layer Tree
1. User views component hierarchy in left panel
2. Clicks layer to select on canvas (bidirectional)
3. Drags layers to reorder/reparent
4. Toggles visibility, locks layers, renames

### 5. Undo/Redo
1. Every state-changing action pushed to history stack
2. Cmd+Z pops and reverses; Cmd+Shift+Z replays
3. History panel shows full operation list
4. Named snapshots for save points

## Non-Functional Requirements

| Requirement | Target | Rationale |
|-------------|--------|-----------|
| Canvas performance | 500+ components, no lag | Professional projects may have complex pages |
| Save latency | < 500ms | Must feel instant for auto-save |
| Undo/Redo latency | < 16ms (one frame) | Must be perceptually instant |
| Export quality | Clean, readable output | Users will read and modify exported code |
| Initial load | < 3s on broadband | Standard web perf target |

## Architecture Considerations for the Architect

### Frontend State Architecture
- **Zustand store** as single source of truth for: component tree, selection state, active breakpoint, clipboard, undo/redo stack
- Component tree stored **flat** (array of components with parentId) — tree derived via selector. Flat storage simplifies updates and undo/redo.
- Undo/redo via **command pattern** or **Zustand temporal middleware** (immer patches)
- Canvas renders from store; property panel reads/writes to store; layer tree reads/writes to store — all reactive via Zustand subscriptions

### Drag and Drop
- @dnd-kit for both **canvas drops** (palette → canvas, reposition) and **layer tree reorder**
- Canvas needs custom collision detection for nested containers
- Drop zones must indicate valid targets (e.g., can't drop a Container inside an Input)

### Component Registry Pattern
- Each component type registered with: schema (editable props), default values, renderer (React component), property panel sections, export handlers (HTML + React)
- Adding new component types = adding a registry entry, not modifying core code

### Backend API Design
- RESTful: `GET/POST/PUT/DELETE /api/projects`, `/api/projects/:id/pages`, `/api/projects/:id/pages/:id`
- Project data serialized as JSON in PostgreSQL (JSONB for component tree)
- Consider: optimistic UI saves with conflict detection for future multi-user

### Export Pipeline
- Tree traversal → per-component code generation → assembly
- HTML export: semantic HTML elements + scoped CSS
- React export: JSX + Tailwind utility classes
- Both share the tree walker; differ in code generators

### Responsive Style Resolution
- Desktop styles are base (always applied)
- Active breakpoint overrides merged on top
- CSS output uses `@media` queries; canvas uses JS merge at active breakpoint
