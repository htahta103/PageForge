package model

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

type Page struct {
	ID         uuid.UUID       `json:"id"`
	ProjectID  uuid.UUID       `json:"projectId"`
	Name       string          `json:"name"`
	Slug       string          `json:"slug"`
	Components json.RawMessage `json:"components"`
	Order      int             `json:"order"`
	CreatedAt  time.Time       `json:"createdAt"`
	UpdatedAt  time.Time       `json:"updatedAt"`
}

type PageSummary struct {
	ID             uuid.UUID `json:"id"`
	ProjectID      uuid.UUID `json:"projectId"`
	Name           string    `json:"name"`
	Slug           string    `json:"slug"`
	Order          int       `json:"order"`
	ComponentCount int       `json:"componentCount"`
}

type CreatePageRequest struct {
	Name string  `json:"name"`
	Slug *string `json:"slug,omitempty"`
}

func (r CreatePageRequest) Validate() error {
	if r.Name == "" {
		return &ValidationError{Field: "name", Message: "is required"}
	}
	if len(r.Name) > 255 {
		return &ValidationError{Field: "name", Message: "must be 255 characters or less"}
	}
	return nil
}

type UpdatePageRequest struct {
	Name       *string          `json:"name,omitempty"`
	Slug       *string          `json:"slug,omitempty"`
	Components *json.RawMessage `json:"components,omitempty"`
	Order      *int             `json:"order,omitempty"`
}

func (r UpdatePageRequest) Validate() error {
	if r.Name != nil && *r.Name == "" {
		return &ValidationError{Field: "name", Message: "cannot be empty"}
	}
	if r.Name != nil && len(*r.Name) > 255 {
		return &ValidationError{Field: "name", Message: "must be 255 characters or less"}
	}
	if r.Components != nil && len(*r.Components) > 10*1024*1024 {
		return &ValidationError{Field: "components", Message: "exceeds 10MB limit"}
	}
	return nil
}

type DuplicatePageRequest struct {
	Name *string `json:"name,omitempty"`
}

type ExportFormat string

const (
	ExportFormatHTML  ExportFormat = "html"
	ExportFormatReact ExportFormat = "react"
)

type ExportResult struct {
	Format string       `json:"format"`
	Files  []ExportFile `json:"files"`
}

type ExportFile struct {
	Path    string `json:"path"`
	Content string `json:"content"`
}
