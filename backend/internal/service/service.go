package service

import (
	"context"
	"encoding/json"
	"time"

	"github.com/google/uuid"
	"github.com/htahta103/PageForge/backend/internal/model"
)

// Repository abstracts the persistence layer so the service can be unit-tested
// without requiring a live PostgreSQL connection.
type Repository interface {
	ListProjects(ctx context.Context, limit, offset int) ([]model.ProjectSummary, int, error)
	GetProject(ctx context.Context, id uuid.UUID) (*model.Project, error)
	CreateProject(ctx context.Context, name string, theme json.RawMessage) (*model.Project, error)
	UpdateProject(ctx context.Context, id uuid.UUID, name *string, theme *json.RawMessage, baseUpdatedAt *time.Time) (*model.Project, error)
	DeleteProject(ctx context.Context, id uuid.UUID) error

	ListPages(ctx context.Context, projectID uuid.UUID) ([]model.PageSummary, error)
	GetPage(ctx context.Context, projectID, pageID uuid.UUID) (*model.Page, error)
	CreatePage(ctx context.Context, projectID uuid.UUID, name, slug string) (*model.Page, error)
	UpdatePage(ctx context.Context, projectID, pageID uuid.UUID, name, slug *string, components *json.RawMessage, order *int, baseUpdatedAt *time.Time) (*model.Page, error)
	DeletePage(ctx context.Context, projectID, pageID uuid.UUID) error
	DuplicatePage(ctx context.Context, projectID, pageID uuid.UUID, newName, newSlug string) (*model.Page, error)
}

type Service struct {
	repo Repository
}

func New(repo Repository) *Service {
	return &Service{repo: repo}
}
