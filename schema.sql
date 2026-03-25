-- PageForge Database Schema
-- PostgreSQL 16+
-- Managed by golang-migrate

-- ============================================================================
-- Extensions
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- Projects
-- ============================================================================

CREATE TABLE projects (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name       VARCHAR(255) NOT NULL,
    theme      JSONB NOT NULL DEFAULT '{
        "colors": {
            "primary": "#3B82F6",
            "secondary": "#8B5CF6",
            "accent": "#F59E0B",
            "neutral-50": "#FAFAFA",
            "neutral-900": "#171717"
        },
        "fonts": {
            "heading": "Inter",
            "body": "Inter"
        },
        "spacing": 4
    }'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_projects_updated_at ON projects (updated_at DESC);

-- ============================================================================
-- Pages
-- ============================================================================

CREATE TABLE pages (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name       VARCHAR(255) NOT NULL,
    slug       VARCHAR(255) NOT NULL,
    components JSONB NOT NULL DEFAULT '[]'::jsonb,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (project_id, slug)
);

CREATE INDEX idx_pages_project_id ON pages (project_id);
CREATE INDEX idx_pages_sort_order ON pages (project_id, sort_order);

-- ============================================================================
-- Trigger: auto-update updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_pages_updated_at
    BEFORE UPDATE ON pages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- Component JSONB structure (for reference — enforced by application layer)
-- ============================================================================
--
-- Each element in pages.components is:
-- {
--   "id":       "uuid",
--   "type":     "text|image|button|container|input|card|nav|list|icon|divider|spacer|video|custom-html",
--   "parentId": "uuid" | null,
--   "children": ["uuid", ...],
--   "props":    { "text": "Hello", "src": "...", ... },
--   "styles": {
--     "base":   { "display": "flex", ... },
--     "tablet": { ... },
--     "mobile": { ... }
--   },
--   "meta": {
--     "name":    "Layer Name",
--     "locked":  false,
--     "visible": true
--   },
--   "order": 0
-- }
--
-- The flat array with parentId references forms a tree.
-- Tree derivation: GROUP BY parentId, ORDER BY order.
-- ============================================================================

-- ============================================================================
-- Useful queries for the backend
-- ============================================================================

-- Count components in a page (for PageSummary.componentCount):
-- SELECT jsonb_array_length(components) FROM pages WHERE id = $1;

-- Find all root components in a page:
-- SELECT elem FROM pages, jsonb_array_elements(components) AS elem
-- WHERE pages.id = $1 AND elem->>'parentId' IS NULL
-- ORDER BY (elem->>'order')::int;
