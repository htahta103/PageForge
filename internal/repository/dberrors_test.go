package repository

import (
	"errors"
	"testing"

	"github.com/jackc/pgx/v5/pgconn"

	"github.com/htahta103/PageForge/backend/internal/model"
)

func TestMapDBError_uniqueViolation(t *testing.T) {
	pgErr := &pgconn.PgError{Code: "23505", ConstraintName: "pages_project_id_slug_key"}
	mapped := mapDBError(pgErr)
	var ce *model.ConflictError
	if !errors.As(mapped, &ce) {
		t.Fatalf("want ConflictError, got %v", mapped)
	}
	if ce.Message == "" {
		t.Fatal("expected message")
	}
}

func TestMapDBError_passThrough(t *testing.T) {
	err := errors.New("other")
	if mapDBError(err) != err {
		t.Fatal("expected same error")
	}
}
