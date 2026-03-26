package repository

import (
	"errors"
	"time"

	"github.com/jackc/pgx/v5/pgconn"

	"github.com/htahta103/PageForge/backend/internal/model"
)

func mapDBError(err error) error {
	if err == nil {
		return nil
	}
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) && pgErr.Code == "23505" {
		return &model.ConflictError{Message: duplicateMessage(pgErr.ConstraintName)}
	}
	return err
}

func duplicateMessage(constraint string) string {
	switch constraint {
	case "pages_project_id_slug_key":
		return "a page with this slug already exists in this project"
	default:
		return "duplicate value violates a unique constraint"
	}
}

// normalizeConcurrencyTS truncates to microsecond precision so clients can echo updatedAt from JSON.
func normalizeConcurrencyTS(t *time.Time) *time.Time {
	if t == nil {
		return nil
	}
	u := t.UTC().Truncate(time.Microsecond)
	return &u
}
