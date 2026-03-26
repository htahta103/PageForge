-- PageForge Database Schema
-- PostgreSQL 16+

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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
