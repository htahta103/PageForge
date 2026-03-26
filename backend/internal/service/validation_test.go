package service

import (
	"context"
	"testing"

	"github.com/google/uuid"
	"github.com/htahta103/PageForge/backend/internal/model"
)

func TestSlugify(t *testing.T) {
	got := slugify("  Hello World  ")
	if got != "hello-world" {
		t.Fatalf("expected %q, got %q", "hello-world", got)
	}
}

func TestProjectService_CreateProject_ValidatesName(t *testing.T) {
	s := &Service{repo: nil}
	ctx := context.Background()

	_, err := s.CreateProject(ctx, model.CreateProjectRequest{Name: ""})
	if err == nil {
		t.Fatalf("expected error")
	}

	longName := make([]byte, 256)
	for i := range longName {
		longName[i] = 'a'
	}
	_, err = s.CreateProject(ctx, model.CreateProjectRequest{Name: string(longName)})
	if err == nil {
		t.Fatalf("expected error for too-long name")
	}
}

func TestProjectService_UpdateProject_ValidatesNamePointer(t *testing.T) {
	s := &Service{repo: nil}
	ctx := context.Background()

	empty := ""
	_, err := s.UpdateProject(ctx, uuid.New(), model.UpdateProjectRequest{Name: &empty})
	if err == nil {
		t.Fatalf("expected error")
	}

	tooLong := make([]byte, 300)
	for i := range tooLong {
		tooLong[i] = 'b'
	}
	_, err = s.UpdateProject(ctx, uuid.New(), model.UpdateProjectRequest{Name: ptrString(string(tooLong))})
	if err == nil {
		t.Fatalf("expected error for too-long name")
	}
}

func TestPageService_CreatePage_ValidatesSlug(t *testing.T) {
	s := &Service{repo: nil}
	ctx := context.Background()
	projectID := uuid.New()

	badSlug := "Bad Slug!"
	_, err := s.CreatePage(ctx, projectID, model.CreatePageRequest{
		Name: "Good Page",
		Slug: &badSlug,
	})
	if err == nil {
		t.Fatalf("expected error for invalid slug")
	}
}

func TestPageService_UpdatePage_ValidatesSlug(t *testing.T) {
	s := &Service{repo: nil}
	ctx := context.Background()
	projectID := uuid.New()
	pageID := uuid.New()

	badSlug := "not valid!"
	_, err := s.UpdatePage(ctx, projectID, pageID, model.UpdatePageRequest{
		Slug: &badSlug,
	})
	if err == nil {
		t.Fatalf("expected error for invalid slug")
	}
}
func ptrString(s string) *string { return &s }
