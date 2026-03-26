package handler

import (
	"net/http"

	"github.com/htahta103/PageForge/backend/internal/model"
)

func (h *Handler) ExportPage(w http.ResponseWriter, r *http.Request) {
	projectID, ok := parseUUID(w, r, "projectId")
	if !ok {
		return
	}
	pageID, ok := parseUUID(w, r, "pageId")
	if !ok {
		return
	}

	formatRaw := r.URL.Query().Get("format")
	if formatRaw == "" {
		writeError(w, http.StatusBadRequest, "validation_error", "format is required")
		return
	}

	var format model.ExportFormat
	switch formatRaw {
	case string(model.ExportFormatHTML):
		format = model.ExportFormatHTML
	case string(model.ExportFormatReact):
		format = model.ExportFormatReact
	default:
		writeError(w, http.StatusBadRequest, "validation_error", "format must be one of: html, react")
		return
	}

	res, err := h.svc.ExportPage(r.Context(), projectID, pageID, format)
	if err != nil {
		handleError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, res)
}

func (h *Handler) ExportPageZip(w http.ResponseWriter, r *http.Request) {
	projectID, ok := parseUUID(w, r, "projectId")
	if !ok {
		return
	}
	pageID, ok := parseUUID(w, r, "pageId")
	if !ok {
		return
	}

	formatRaw := r.URL.Query().Get("format")
	if formatRaw == "" {
		writeError(w, http.StatusBadRequest, "validation_error", "format is required")
		return
	}

	var format model.ExportFormat
	switch formatRaw {
	case string(model.ExportFormatHTML):
		format = model.ExportFormatHTML
	case string(model.ExportFormatReact):
		format = model.ExportFormatReact
	default:
		writeError(w, http.StatusBadRequest, "validation_error", "format must be one of: html, react")
		return
	}

	zipBytes, err := h.svc.ExportPageZip(r.Context(), projectID, pageID, format)
	if err != nil {
		handleError(w, err)
		return
	}

	w.Header().Set("Content-Type", "application/zip")
	w.Header().Set("Content-Disposition", "attachment; filename=pageforge-export.zip")
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write(zipBytes)
}
