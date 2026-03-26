DROP TRIGGER IF EXISTS trg_pages_updated_at ON pages;
DROP TRIGGER IF EXISTS trg_projects_updated_at ON projects;
DROP FUNCTION IF EXISTS update_updated_at();
DROP TABLE IF EXISTS pages;
DROP TABLE IF EXISTS projects;
DROP EXTENSION IF EXISTS "uuid-ossp";
