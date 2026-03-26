package repository

import (
	"context"
	"encoding/json"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"github.com/htahta103/PageForge/backend/internal/model"
)

func (r *Repository) ListProjects(ctx context.Context, limit, offset int) ([]model.ProjectSummary, int, error) {
	var total int
	err := r.pool.QueryRow(ctx, "SELECT COUNT(*) FROM projects").Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	rows, err := r.pool.Query(ctx, `
		SELECT p.id, p.name, COUNT(pg.id)::int AS page_count, p.created_at, p.updated_at
		FROM projects p
		LEFT JOIN pages pg ON pg.project_id = p.id
		GROUP BY p.id
		ORDER BY p.updated_at DESC
		LIMIT $1 OFFSET $2
	`, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var projects []model.ProjectSummary
	for rows.Next() {
		var p model.ProjectSummary
		if err := rows.Scan(&p.ID, &p.Name, &p.PageCount, &p.CreatedAt, &p.UpdatedAt); err != nil {
			return nil, 0, err
		}
		projects = append(projects, p)
	}
	return projects, total, rows.Err()
}

func (r *Repository) GetProject(ctx context.Context, id uuid.UUID) (*model.Project, error) {
	var p model.Project
	var themeJSON []byte
	err := r.pool.QueryRow(ctx, `
		SELECT id, name, theme, created_at, updated_at FROM projects WHERE id = $1
	`, id).Scan(&p.ID, &p.Name, &themeJSON, &p.CreatedAt, &p.UpdatedAt)
	if err == pgx.ErrNoRows {
		return nil, &model.NotFoundError{Resource: "Project", ID: id.String()}
	}
	if err != nil {
		return nil, err
	}
	if err := json.Unmarshal(themeJSON, &p.Theme); err != nil {
		return nil, err
	}
	return &p, nil
}

func (r *Repository) CreateProject(ctx context.Context, name string, theme json.RawMessage) (*model.Project, error) {
	var p model.Project
	var themeJSON []byte
	err := r.pool.QueryRow(ctx, `
		INSERT INTO projects (name, theme) VALUES ($1, $2)
		RETURNING id, name, theme, created_at, updated_at
	`, name, theme).Scan(&p.ID, &p.Name, &themeJSON, &p.CreatedAt, &p.UpdatedAt)
	if err != nil {
		return nil, err
	}
	if err := json.Unmarshal(themeJSON, &p.Theme); err != nil {
		return nil, err
	}
	return &p, nil
}

func (r *Repository) UpdateProject(ctx context.Context, id uuid.UUID, name *string, theme *json.RawMessage) (*model.Project, error) {
	var p model.Project
	var themeJSON []byte
	err := r.pool.QueryRow(ctx, `
		UPDATE projects
		SET name = COALESCE($2, name),
		    theme = COALESCE($3, theme)
		WHERE id = $1
		RETURNING id, name, theme, created_at, updated_at
	`, id, name, theme).Scan(&p.ID, &p.Name, &themeJSON, &p.CreatedAt, &p.UpdatedAt)
	if err == pgx.ErrNoRows {
		return nil, &model.NotFoundError{Resource: "Project", ID: id.String()}
	}
	if err != nil {
		return nil, err
	}
	if err := json.Unmarshal(themeJSON, &p.Theme); err != nil {
		return nil, err
	}
	return &p, nil
}

func (r *Repository) DeleteProject(ctx context.Context, id uuid.UUID) error {
	tag, err := r.pool.Exec(ctx, "DELETE FROM projects WHERE id = $1", id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return &model.NotFoundError{Resource: "Project", ID: id.String()}
	}
	return nil
}
