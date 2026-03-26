package model

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

type Theme struct {
	Colors  map[string]string `json:"colors"`
	Fonts   ThemeFonts        `json:"fonts"`
	Spacing float64           `json:"spacing"`
}

type ThemeFonts struct {
	Heading string `json:"heading"`
	Body    string `json:"body"`
}

var DefaultTheme = Theme{
	Colors: map[string]string{
		"primary":     "#3B82F6",
		"secondary":   "#8B5CF6",
		"accent":      "#F59E0B",
		"neutral-50":  "#FAFAFA",
		"neutral-900": "#171717",
	},
	Fonts:   ThemeFonts{Heading: "Inter", Body: "Inter"},
	Spacing: 4,
}

type Project struct {
	ID        uuid.UUID `json:"id"`
	Name      string    `json:"name"`
	Theme     Theme     `json:"theme"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

type ProjectSummary struct {
	ID        uuid.UUID `json:"id"`
	Name      string    `json:"name"`
	PageCount int       `json:"pageCount"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

type CreateProjectRequest struct {
	Name  string `json:"name"`
	Theme *Theme `json:"theme,omitempty"`
}

func (r CreateProjectRequest) Validate() error {
	if r.Name == "" {
		return &ValidationError{Field: "name", Message: "is required"}
	}
	if len(r.Name) > 255 {
		return &ValidationError{Field: "name", Message: "must be 255 characters or less"}
	}
	return nil
}

type UpdateProjectRequest struct {
	Name  *string `json:"name,omitempty"`
	Theme *Theme  `json:"theme,omitempty"`
}

func (r UpdateProjectRequest) Validate() error {
	if r.Name != nil && *r.Name == "" {
		return &ValidationError{Field: "name", Message: "cannot be empty"}
	}
	if r.Name != nil && len(*r.Name) > 255 {
		return &ValidationError{Field: "name", Message: "must be 255 characters or less"}
	}
	return nil
}

// ThemeJSON returns the theme as raw JSON bytes for database storage.
func ThemeJSON(t Theme) (json.RawMessage, error) {
	return json.Marshal(t)
}
