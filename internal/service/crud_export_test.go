package service

import (
	"archive/zip"
	"bytes"
	"context"
	"encoding/json"
	"io"
	"strings"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/htahta103/PageForge/backend/internal/model"
)

type fakeRepository struct {
	// ListProjects
	lastListProjectsLimit  int
	lastListProjectsOffset int
	listProjectsResp       []model.ProjectSummary
	listProjectsTotal      int

	// Projects
	lastCreateProjectName  string
	lastCreateProjectTheme model.Theme
	lastUpdateProjectName  *string
	lastUpdateProjectTheme *model.Theme

	// Pages
	lastListPagesProjectID uuid.UUID
	lastGetPageProjectID   uuid.UUID
	lastGetPagePageID      uuid.UUID
	lastCreatePageName     string
	lastCreatePageSlug     string
	lastUpdatePageName     *string
	lastUpdatePageSlug     *string
	lastUpdatePageOrder    *int
	lastDuplicateNewName   string

	pageToReturn *model.Page
}

func (f *fakeRepository) ListProjects(ctx context.Context, limit, offset int) ([]model.ProjectSummary, int, error) {
	f.lastListProjectsLimit = limit
	f.lastListProjectsOffset = offset
	return f.listProjectsResp, f.listProjectsTotal, nil
}

func (f *fakeRepository) GetProject(ctx context.Context, id uuid.UUID) (*model.Project, error) {
	return &model.Project{ID: id, Name: "X", Theme: model.DefaultTheme, CreatedAt: time.Now(), UpdatedAt: time.Now()}, nil
}

func (f *fakeRepository) CreateProject(ctx context.Context, name string, theme json.RawMessage) (*model.Project, error) {
	f.lastCreateProjectName = name
	var t model.Theme
	_ = json.Unmarshal(theme, &t)
	f.lastCreateProjectTheme = t
	return &model.Project{ID: uuid.New(), Name: name, Theme: t, CreatedAt: time.Now(), UpdatedAt: time.Now()}, nil
}

func (f *fakeRepository) UpdateProject(ctx context.Context, id uuid.UUID, name *string, theme *json.RawMessage) (*model.Project, error) {
	f.lastUpdateProjectName = name
	if theme == nil {
		f.lastUpdateProjectTheme = nil
	} else {
		var t model.Theme
		_ = json.Unmarshal(*theme, &t)
		f.lastUpdateProjectTheme = &t
	}
	updatedName := "X"
	if name != nil {
		updatedName = *name
	}
	updatedTheme := model.DefaultTheme
	if f.lastUpdateProjectTheme != nil {
		updatedTheme = *f.lastUpdateProjectTheme
	}
	return &model.Project{ID: id, Name: updatedName, Theme: updatedTheme, CreatedAt: time.Now(), UpdatedAt: time.Now()}, nil
}

func (f *fakeRepository) DeleteProject(ctx context.Context, id uuid.UUID) error { return nil }

func (f *fakeRepository) ListPages(ctx context.Context, projectID uuid.UUID) ([]model.PageSummary, error) {
	f.lastListPagesProjectID = projectID
	return []model.PageSummary{}, nil
}

func (f *fakeRepository) GetPage(ctx context.Context, projectID, pageID uuid.UUID) (*model.Page, error) {
	f.lastGetPageProjectID = projectID
	f.lastGetPagePageID = pageID
	if f.pageToReturn == nil {
		return nil, &model.NotFoundError{Resource: "Page", ID: pageID.String()}
	}
	return f.pageToReturn, nil
}

func (f *fakeRepository) CreatePage(ctx context.Context, projectID uuid.UUID, name, slug string) (*model.Page, error) {
	f.lastCreatePageName = name
	f.lastCreatePageSlug = slug
	return &model.Page{
		ID:         uuid.New(),
		ProjectID:  projectID,
		Name:       name,
		Slug:       slug,
		Components: json.RawMessage(`[]`),
		Order:      0,
		CreatedAt:  time.Now(),
		UpdatedAt:  time.Now(),
	}, nil
}

func (f *fakeRepository) UpdatePage(ctx context.Context, projectID, pageID uuid.UUID, name, slug *string, components *json.RawMessage, order *int) (*model.Page, error) {
	f.lastUpdatePageName = name
	f.lastUpdatePageSlug = slug
	f.lastUpdatePageOrder = order
	updatedName := "old"
	if name != nil {
		updatedName = *name
	}
	updatedSlug := "old-slug"
	if slug != nil {
		updatedSlug = *slug
	}
	return &model.Page{
		ID:         pageID,
		ProjectID:  projectID,
		Name:       updatedName,
		Slug:       updatedSlug,
		Components: json.RawMessage(`[]`),
		Order:      0,
		CreatedAt:  time.Now(),
		UpdatedAt:  time.Now(),
	}, nil
}

func (f *fakeRepository) DeletePage(ctx context.Context, projectID, pageID uuid.UUID) error {
	return nil
}

func (f *fakeRepository) DuplicatePage(ctx context.Context, projectID, pageID uuid.UUID, newName string) (*model.Page, error) {
	f.lastDuplicateNewName = newName
	return &model.Page{
		ID:         uuid.New(),
		ProjectID:  projectID,
		Name:       newName,
		Slug:       "copy",
		Components: json.RawMessage(`[]`),
		Order:      0,
		CreatedAt:  time.Now(),
		UpdatedAt:  time.Now(),
	}, nil
}

func TestListProjects_ClampsLimitAndOffset(t *testing.T) {
	repo := &fakeRepository{}
	svc := New(repo)

	_, _, err := svc.ListProjects(context.Background(), 0, -10)
	if err != nil {
		t.Fatalf("unexpected err: %v", err)
	}
	if repo.lastListProjectsLimit != 50 {
		t.Fatalf("expected limit clamp to 50, got %d", repo.lastListProjectsLimit)
	}
	if repo.lastListProjectsOffset != 0 {
		t.Fatalf("expected offset clamp to 0, got %d", repo.lastListProjectsOffset)
	}
}

func TestCreateProject_UsesDefaultThemeWhenNil(t *testing.T) {
	repo := &fakeRepository{}
	svc := New(repo)

	_, err := svc.CreateProject(context.Background(), model.CreateProjectRequest{Name: "My Project"})
	if err != nil {
		t.Fatalf("unexpected err: %v", err)
	}

	if repo.lastCreateProjectName != "My Project" {
		t.Fatalf("expected name passthrough")
	}
	if repo.lastCreateProjectTheme.Spacing != model.DefaultTheme.Spacing {
		t.Fatalf("expected default theme spacing %v, got %v", model.DefaultTheme.Spacing, repo.lastCreateProjectTheme.Spacing)
	}
}

func TestCreatePage_SlugifyWhenSlugOmitted(t *testing.T) {
	repo := &fakeRepository{}
	svc := New(repo)

	_, err := svc.CreatePage(context.Background(), uuid.New(), model.CreatePageRequest{Name: "Hello World"})
	if err != nil {
		t.Fatalf("unexpected err: %v", err)
	}
	if repo.lastCreatePageSlug != "hello-world" {
		t.Fatalf("expected slug %q, got %q", "hello-world", repo.lastCreatePageSlug)
	}
}

func TestDuplicatePage_UsesDefaultCopyName(t *testing.T) {
	pageID := uuid.New()
	projectID := uuid.New()
	repo := &fakeRepository{
		pageToReturn: &model.Page{
			ID:         pageID,
			ProjectID:  projectID,
			Name:       "Original",
			Slug:       "original",
			Components: json.RawMessage(`[]`),
			Order:      0,
			CreatedAt:  time.Now(),
			UpdatedAt:  time.Now(),
		},
	}
	svc := New(repo)

	_, err := svc.DuplicatePage(context.Background(), projectID, pageID, nil)
	if err != nil {
		t.Fatalf("unexpected err: %v", err)
	}
	if repo.lastDuplicateNewName != "Copy of Original" {
		t.Fatalf("expected %q, got %q", "Copy of Original", repo.lastDuplicateNewName)
	}
}

func TestExportPage_HTMLAndZIP(t *testing.T) {
	projectID := uuid.New()
	pageID := uuid.New()

	parentID := "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
	childID := "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"
	visible := true

	components := []model.ComponentJSON{
		{
			ID:       parentID,
			Type:     model.ComponentTypeContainer,
			ParentID: nil,
			Children: []string{childID},
			Props:    map[string]any{},
			Styles: model.ComponentStylesJSON{
				Base: map[string]any{"padding": "4px"},
			},
			Meta:  model.ComponentMetaJSON{Visible: &visible},
			Order: 0,
		},
		{
			ID:       childID,
			Type:     model.ComponentTypeText,
			ParentID: &parentID,
			Props:    map[string]any{"text": "Hello"},
			Styles: model.ComponentStylesJSON{
				Base: map[string]any{"color": "red"},
			},
			Meta:  model.ComponentMetaJSON{Visible: &visible},
			Order: 1,
		},
	}

	rawComponents, err := json.Marshal(components)
	if err != nil {
		t.Fatalf("marshal components: %v", err)
	}

	repo := &fakeRepository{
		pageToReturn: &model.Page{
			ID:         pageID,
			ProjectID:  projectID,
			Name:       "Export Me",
			Slug:       "export-me",
			Components: rawComponents,
			Order:      0,
			CreatedAt:  time.Now(),
			UpdatedAt:  time.Now(),
		},
	}
	svc := New(repo)

	res, err := svc.ExportPage(context.Background(), projectID, pageID, model.ExportFormatHTML)
	if err != nil {
		t.Fatalf("unexpected err: %v", err)
	}
	if res.Format != "html" {
		t.Fatalf("expected html format, got %q", res.Format)
	}

	// Ensure markup + scoped CSS show up.
	var htmlDoc string
	var cssDoc string
	for _, f := range res.Files {
		if f.Path == "index.html" {
			htmlDoc = f.Content
		}
		if f.Path == "styles.css" {
			cssDoc = f.Content
		}
	}
	if htmlDoc == "" || !strings.Contains(htmlDoc, `data-pf-id="`+parentID+`"`) {
		t.Fatalf("expected HTML to contain scoped markup for root")
	}
	if cssDoc == "" || !strings.Contains(cssDoc, `data-pf-id="`+childID+`"`) {
		t.Fatalf("expected CSS to contain scoped rule for child")
	}

	zipBytes, err := svc.ExportPageZip(context.Background(), projectID, pageID, model.ExportFormatHTML)
	if err != nil {
		t.Fatalf("unexpected err: %v", err)
	}

	zr, err := zip.NewReader(bytes.NewReader(zipBytes), int64(len(zipBytes)))
	if err != nil {
		t.Fatalf("zip reader: %v", err)
	}

	var names []string
	for _, f := range zr.File {
		names = append(names, f.Name)
	}
	if !contains(names, "index.html") || !contains(names, "styles.css") {
		t.Fatalf("expected zip to contain index.html + styles.css, got: %v", names)
	}

	// Smoke-check a file can be read.
	indexFile := findFile(zr.File, "index.html")
	rc, err := indexFile.Open()
	if err != nil {
		t.Fatalf("open index.html: %v", err)
	}
	defer rc.Close()
	b, _ := io.ReadAll(rc)
	if !strings.Contains(string(b), "Hello") {
		t.Fatalf("expected exported HTML to include component text")
	}
}

func TestExportPage_ReactAndZIP(t *testing.T) {
	projectID := uuid.New()
	pageID := uuid.New()

	parentID := "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
	childID := "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"
	visible := true

	components := []model.ComponentJSON{
		{
			ID:       parentID,
			Type:     model.ComponentTypeContainer,
			ParentID: nil,
			Children: []string{childID},
			Props:    map[string]any{},
			Styles: model.ComponentStylesJSON{
				Base: map[string]any{"padding": "4px"},
			},
			Meta:  model.ComponentMetaJSON{Visible: &visible},
			Order: 0,
		},
		{
			ID:       childID,
			Type:     model.ComponentTypeText,
			ParentID: &parentID,
			Props:    map[string]any{"text": "Hello"},
			Styles: model.ComponentStylesJSON{
				Base: map[string]any{"color": "red"},
			},
			Meta:  model.ComponentMetaJSON{Visible: &visible},
			Order: 1,
		},
	}

	rawComponents, err := json.Marshal(components)
	if err != nil {
		t.Fatalf("marshal components: %v", err)
	}

	repo := &fakeRepository{
		pageToReturn: &model.Page{
			ID:         pageID,
			ProjectID:  projectID,
			Name:       "Export Me",
			Slug:       "export-me",
			Components: rawComponents,
			Order:      0,
			CreatedAt:  time.Now(),
			UpdatedAt:  time.Now(),
		},
	}
	svc := New(repo)

	res, err := svc.ExportPage(context.Background(), projectID, pageID, model.ExportFormatReact)
	if err != nil {
		t.Fatalf("unexpected err: %v", err)
	}
	if res.Format != "react" {
		t.Fatalf("expected react format, got %q", res.Format)
	}

	var indexTSX string
	for _, f := range res.Files {
		if f.Path == "index.tsx" {
			indexTSX = f.Content
		}
	}
	if indexTSX == "" || !strings.Contains(indexTSX, "dangerouslySetInnerHTML") {
		t.Fatalf("expected react index.tsx to include dangerouslySetInnerHTML")
	}
	if !strings.Contains(indexTSX, "Hello") {
		t.Fatalf("expected exported React to include component text")
	}

	zipBytes, err := svc.ExportPageZip(context.Background(), projectID, pageID, model.ExportFormatReact)
	if err != nil {
		t.Fatalf("unexpected err: %v", err)
	}

	zr, err := zip.NewReader(bytes.NewReader(zipBytes), int64(len(zipBytes)))
	if err != nil {
		t.Fatalf("zip reader: %v", err)
	}

	var names []string
	for _, f := range zr.File {
		names = append(names, f.Name)
	}
	if !contains(names, "index.tsx") || !contains(names, "styles.css") {
		t.Fatalf("expected zip to contain index.tsx + styles.css, got: %v", names)
	}
}

func contains(xs []string, target string) bool {
	for _, x := range xs {
		if x == target {
			return true
		}
	}
	return false
}

func findFile(files []*zip.File, name string) *zip.File {
	for _, f := range files {
		if f.Name == name {
			return f
		}
	}
	return nil
}
