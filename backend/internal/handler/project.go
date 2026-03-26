package handler

import (
	"context"
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"github.com/htahta103/PageForge/backend/internal/model"
)

const projectsRequestTimeout = 20 * time.Second

func (h *Handler) ListProjects(w http.ResponseWriter, r *http.Request) {
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))

	ctx, cancel := context.WithTimeout(r.Context(), projectsRequestTimeout)
	defer cancel()

	projects, total, err := h.svc.ListProjects(ctx, limit, offset)
	if err != nil {
		handleError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"data":  projects,
		"total": total,
	})
}

func (h *Handler) CreateProject(w http.ResponseWriter, r *http.Request) {
	var req model.CreateProjectRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "validation_error", "invalid JSON body")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), projectsRequestTimeout)
	defer cancel()

	project, err := h.svc.CreateProject(ctx, req)
	if err != nil {
		handleError(w, err)
		return
	}

	writeJSON(w, http.StatusCreated, project)
}

func (h *Handler) GetProject(w http.ResponseWriter, r *http.Request) {
	id, ok := parseUUID(w, r, "projectId")
	if !ok {
		return
	}

	project, err := h.svc.GetProject(r.Context(), id)
	if err != nil {
		handleError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, project)
}

func (h *Handler) UpdateProject(w http.ResponseWriter, r *http.Request) {
	id, ok := parseUUID(w, r, "projectId")
	if !ok {
		return
	}

	var req model.UpdateProjectRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "validation_error", "invalid JSON body")
		return
	}

	project, err := h.svc.UpdateProject(r.Context(), id, req)
	if err != nil {
		handleError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, project)
}

func (h *Handler) DeleteProject(w http.ResponseWriter, r *http.Request) {
	id, ok := parseUUID(w, r, "projectId")
	if !ok {
		return
	}

	if err := h.svc.DeleteProject(r.Context(), id); err != nil {
		handleError(w, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
