package repository

import (
	"context"
	"encoding/json"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"github.com/htahta103/PageForge/backend/internal/model"
)

func (r *Repository) ListPages(ctx context.Context, projectID uuid.UUID) ([]model.PageSummary, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, project_id, name, slug, sort_order, jsonb_array_length(components)
		FROM pages
		WHERE project_id = $1
		ORDER BY sort_order
	`, projectID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var pages []model.PageSummary
	for rows.Next() {
		var p model.PageSummary
		if err := rows.Scan(&p.ID, &p.ProjectID, &p.Name, &p.Slug, &p.Order, &p.ComponentCount); err != nil {
			return nil, err
		}
		pages = append(pages, p)
	}
	return pages, rows.Err()
}

func (r *Repository) GetPage(ctx context.Context, projectID, pageID uuid.UUID) (*model.Page, error) {
	var p model.Page
	err := r.pool.QueryRow(ctx, `
		SELECT id, project_id, name, slug, components, sort_order, created_at, updated_at
		FROM pages
		WHERE id = $1 AND project_id = $2
	`, pageID, projectID).Scan(&p.ID, &p.ProjectID, &p.Name, &p.Slug, &p.Components, &p.Order, &p.CreatedAt, &p.UpdatedAt)
	if err == pgx.ErrNoRows {
		return nil, &model.NotFoundError{Resource: "Page", ID: pageID.String()}
	}
	if err != nil {
		return nil, err
	}
	return &p, nil
}

func (r *Repository) CreatePage(ctx context.Context, projectID uuid.UUID, name, slug string) (*model.Page, error) {
	var p model.Page
	err := r.pool.QueryRow(ctx, `
		INSERT INTO pages (project_id, name, slug, sort_order)
		VALUES ($1, $2, $3, COALESCE((SELECT MAX(sort_order) + 1 FROM pages WHERE project_id = $1), 0))
		RETURNING id, project_id, name, slug, components, sort_order, created_at, updated_at
	`, projectID, name, slug).Scan(&p.ID, &p.ProjectID, &p.Name, &p.Slug, &p.Components, &p.Order, &p.CreatedAt, &p.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &p, nil
}

func (r *Repository) UpdatePage(ctx context.Context, projectID, pageID uuid.UUID, name, slug *string, components *json.RawMessage, order *int) (*model.Page, error) {
	var p model.Page
	err := r.pool.QueryRow(ctx, `
		UPDATE pages
		SET name = COALESCE($3, name),
		    slug = COALESCE($4, slug),
		    components = COALESCE($5, components),
		    sort_order = COALESCE($6, sort_order)
		WHERE id = $1 AND project_id = $2
		RETURNING id, project_id, name, slug, components, sort_order, created_at, updated_at
	`, pageID, projectID, name, slug, components, order).Scan(&p.ID, &p.ProjectID, &p.Name, &p.Slug, &p.Components, &p.Order, &p.CreatedAt, &p.UpdatedAt)
	if err == pgx.ErrNoRows {
		return nil, &model.NotFoundError{Resource: "Page", ID: pageID.String()}
	}
	if err != nil {
		return nil, err
	}
	return &p, nil
}

func (r *Repository) DeletePage(ctx context.Context, projectID, pageID uuid.UUID) error {
	tag, err := r.pool.Exec(ctx, "DELETE FROM pages WHERE id = $1 AND project_id = $2", pageID, projectID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return &model.NotFoundError{Resource: "Page", ID: pageID.String()}
	}
	return nil
}

func (r *Repository) DuplicatePage(ctx context.Context, projectID, pageID uuid.UUID, newName string) (*model.Page, error) {
	var p model.Page
	err := r.pool.QueryRow(ctx, `
		INSERT INTO pages (project_id, name, slug, components, sort_order)
		SELECT project_id, $3, $3 || '-' || substr(gen_random_uuid()::text, 1, 8), components,
		       COALESCE((SELECT MAX(sort_order) + 1 FROM pages WHERE project_id = $1), 0)
		FROM pages
		WHERE id = $2 AND project_id = $1
		RETURNING id, project_id, name, slug, components, sort_order, created_at, updated_at
	`, projectID, pageID, newName).Scan(&p.ID, &p.ProjectID, &p.Name, &p.Slug, &p.Components, &p.Order, &p.CreatedAt, &p.UpdatedAt)
	if err == pgx.ErrNoRows {
		return nil, &model.NotFoundError{Resource: "Page", ID: pageID.String()}
	}
	if err != nil {
		return nil, err
	}
	return &p, nil
}
