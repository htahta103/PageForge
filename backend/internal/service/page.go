package service

import (
	"context"
	"fmt"
	"regexp"
	"strings"

	"github.com/google/uuid"

	"github.com/htahta103/PageForge/backend/internal/model"
)

var slugRe = regexp.MustCompile(`^[a-z0-9-]+$`)

func (s *Service) ListPages(ctx context.Context, projectID uuid.UUID) ([]model.PageSummary, error) {
	return s.repo.ListPages(ctx, projectID)
}

func (s *Service) GetPage(ctx context.Context, projectID, pageID uuid.UUID) (*model.Page, error) {
	return s.repo.GetPage(ctx, projectID, pageID)
}

func (s *Service) CreatePage(ctx context.Context, projectID uuid.UUID, req model.CreatePageRequest) (*model.Page, error) {
	if err := req.Validate(); err != nil {
		return nil, err
	}

	slug := slugify(req.Name)
	if req.Slug != nil && *req.Slug != "" {
		slug = *req.Slug
	}
	if !slugRe.MatchString(slug) {
		return nil, &model.ValidationError{Field: "slug", Message: "must match ^[a-z0-9-]+$"}
	}

	return s.repo.CreatePage(ctx, projectID, req.Name, slug)
}

func (s *Service) UpdatePage(ctx context.Context, projectID, pageID uuid.UUID, req model.UpdatePageRequest) (*model.Page, error) {
	if err := req.Validate(); err != nil {
		return nil, err
	}
	if req.Slug != nil && !slugRe.MatchString(*req.Slug) {
		return nil, &model.ValidationError{Field: "slug", Message: "must match ^[a-z0-9-]+$"}
	}
	return s.repo.UpdatePage(ctx, projectID, pageID, req.Name, req.Slug, req.Components, req.Order, req.BaseUpdatedAt)
}

func (s *Service) DeletePage(ctx context.Context, projectID, pageID uuid.UUID) error {
	return s.repo.DeletePage(ctx, projectID, pageID)
}

func (s *Service) DuplicatePage(ctx context.Context, projectID, pageID uuid.UUID, name *string) (*model.Page, error) {
	src, err := s.repo.GetPage(ctx, projectID, pageID)
	if err != nil {
		return nil, err
	}
	newName := fmt.Sprintf("Copy of %s", src.Name)
	if name != nil && *name != "" {
		newName = *name
	}
	return s.repo.DuplicatePage(ctx, projectID, pageID, newName)
}

func slugify(s string) string {
	s = strings.ToLower(strings.TrimSpace(s))
	s = strings.ReplaceAll(s, " ", "-")
	result := strings.Builder{}
	for _, c := range s {
		if (c >= 'a' && c <= 'z') || (c >= '0' && c <= '9') || c == '-' {
			result.WriteRune(c)
		}
	}
	return result.String()
}
