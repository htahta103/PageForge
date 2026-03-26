package handler

import (
	"encoding/json"
	"net/http"

	"github.com/htahta103/PageForge/backend/internal/model"
)

func (h *Handler) ListPages(w http.ResponseWriter, r *http.Request) {
	projectID, ok := parseUUID(w, r, "projectId")
	if !ok {
		return
	}

	pages, err := h.svc.ListPages(r.Context(), projectID)
	if err != nil {
		handleError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{"data": pages})
}

func (h *Handler) CreatePage(w http.ResponseWriter, r *http.Request) {
	projectID, ok := parseUUID(w, r, "projectId")
	if !ok {
		return
	}

	var req model.CreatePageRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "validation_error", "invalid JSON body")
		return
	}

	page, err := h.svc.CreatePage(r.Context(), projectID, req)
	if err != nil {
		handleError(w, err)
		return
	}

	writeJSON(w, http.StatusCreated, page)
}

func (h *Handler) GetPage(w http.ResponseWriter, r *http.Request) {
	projectID, ok := parseUUID(w, r, "projectId")
	if !ok {
		return
	}
	pageID, ok := parseUUID(w, r, "pageId")
	if !ok {
		return
	}

	page, err := h.svc.GetPage(r.Context(), projectID, pageID)
	if err != nil {
		handleError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, page)
}

func (h *Handler) UpdatePage(w http.ResponseWriter, r *http.Request) {
	projectID, ok := parseUUID(w, r, "projectId")
	if !ok {
		return
	}
	pageID, ok := parseUUID(w, r, "pageId")
	if !ok {
		return
	}

	var req model.UpdatePageRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "validation_error", "invalid JSON body")
		return
	}

	page, err := h.svc.UpdatePage(r.Context(), projectID, pageID, req)
	if err != nil {
		handleError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, page)
}

func (h *Handler) DeletePage(w http.ResponseWriter, r *http.Request) {
	projectID, ok := parseUUID(w, r, "projectId")
	if !ok {
		return
	}
	pageID, ok := parseUUID(w, r, "pageId")
	if !ok {
		return
	}

	if err := h.svc.DeletePage(r.Context(), projectID, pageID); err != nil {
		handleError(w, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) DuplicatePage(w http.ResponseWriter, r *http.Request) {
	projectID, ok := parseUUID(w, r, "projectId")
	if !ok {
		return
	}
	pageID, ok := parseUUID(w, r, "pageId")
	if !ok {
		return
	}

	var req model.DuplicatePageRequest
	json.NewDecoder(r.Body).Decode(&req)

	page, err := h.svc.DuplicatePage(r.Context(), projectID, pageID, req.Name)
	if err != nil {
		handleError(w, err)
		return
	}

	writeJSON(w, http.StatusCreated, page)
}
