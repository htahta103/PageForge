package handler

import "net/http"

// ExportPage and ExportPageZip are stubs for the export feature.
// Implementation will be added by the backend team.

func (h *Handler) ExportPage(w http.ResponseWriter, r *http.Request) {
	writeError(w, http.StatusNotImplemented, "not_implemented", "export not yet implemented")
}

func (h *Handler) ExportPageZip(w http.ResponseWriter, r *http.Request) {
	writeError(w, http.StatusNotImplemented, "not_implemented", "export not yet implemented")
}
