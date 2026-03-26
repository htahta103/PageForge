package handler

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"github.com/htahta103/PageForge/backend/internal/model"
	"github.com/htahta103/PageForge/backend/internal/service"
)

type Handler struct {
	svc *service.Service
}

func New(svc *service.Service) *Handler {
	return &Handler{svc: svc}
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, status int, code, message string) {
	writeJSON(w, status, map[string]string{"code": code, "message": message})
}

func handleError(w http.ResponseWriter, err error) {
	if errors.Is(err, context.DeadlineExceeded) {
		writeError(w, http.StatusGatewayTimeout, "timeout", "request timed out")
		return
	}

	var validationErr *model.ValidationError
	if errors.As(err, &validationErr) {
		writeError(w, http.StatusBadRequest, "validation_error", err.Error())
		return
	}
	var notFoundErr *model.NotFoundError
	if errors.As(err, &notFoundErr) {
		writeError(w, http.StatusNotFound, "not_found", err.Error())
		return
	}
	var conflictErr *model.ConflictError
	if errors.As(err, &conflictErr) {
		writeError(w, http.StatusConflict, "conflict", conflictErr.Message)
		return
	}
	writeError(w, http.StatusInternalServerError, "internal_error", "internal server error")
}

func parseUUID(w http.ResponseWriter, r *http.Request, param string) (uuid.UUID, bool) {
	raw := chi.URLParam(r, param)
	id, err := uuid.Parse(raw)
	if err != nil {
		writeError(w, http.StatusBadRequest, "validation_error", param+" must be a valid UUID")
		return uuid.Nil, false
	}
	return id, true
}
