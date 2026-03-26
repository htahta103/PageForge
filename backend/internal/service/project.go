package service

import (
	"context"
	"encoding/json"

	"github.com/google/uuid"

	"github.com/htahta103/PageForge/backend/internal/model"
)

func (s *Service) ListProjects(ctx context.Context, limit, offset int) ([]model.ProjectSummary, int, error) {
	if limit <= 0 || limit > 100 {
		limit = 50
	}
	if offset < 0 {
		offset = 0
	}
	return s.repo.ListProjects(ctx, limit, offset)
}

func (s *Service) GetProject(ctx context.Context, id uuid.UUID) (*model.Project, error) {
	return s.repo.GetProject(ctx, id)
}

func (s *Service) CreateProject(ctx context.Context, req model.CreateProjectRequest) (*model.Project, error) {
	if err := req.Validate(); err != nil {
		return nil, err
	}

	theme := model.DefaultTheme
	if req.Theme != nil {
		theme = *req.Theme
	}
	themeJSON, err := json.Marshal(theme)
	if err != nil {
		return nil, err
	}

	return s.repo.CreateProject(ctx, req.Name, themeJSON)
}

func (s *Service) UpdateProject(ctx context.Context, id uuid.UUID, req model.UpdateProjectRequest) (*model.Project, error) {
	if err := req.Validate(); err != nil {
		return nil, err
	}

	var themeJSON *json.RawMessage
	if req.Theme != nil {
		raw, err := json.Marshal(req.Theme)
		if err != nil {
			return nil, err
		}
		rawMsg := json.RawMessage(raw)
		themeJSON = &rawMsg
	}

	return s.repo.UpdateProject(ctx, id, req.Name, themeJSON, req.BaseUpdatedAt)
}

func (s *Service) DeleteProject(ctx context.Context, id uuid.UUID) error {
	return s.repo.DeleteProject(ctx, id)
}
