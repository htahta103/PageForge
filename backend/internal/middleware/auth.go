package middleware

import (
	"crypto/subtle"
	"encoding/json"
	"net/http"
	"strings"
)

// RequireBearerToken enforces a single shared Bearer token.
//
// If expectedToken is empty, auth is disabled (useful for local dev).
// This is intentionally minimal until the product defines real auth (users/sessions).
func RequireBearerToken(expectedToken string) func(http.Handler) http.Handler {
	expectedToken = strings.TrimSpace(expectedToken)

	writeUnauthorized := func(w http.ResponseWriter) {
		// Keep auth errors consistent with the API's standard error schema:
		// { "code": "...", "message": "..." }
		w.Header().Set("Content-Type", "application/json")
		// Hint browsers/clients which auth scheme to use.
		w.Header().Set("WWW-Authenticate", "Bearer")
		w.WriteHeader(http.StatusUnauthorized)
		_ = json.NewEncoder(w).Encode(map[string]string{
			"code":    "unauthorized",
			"message": "unauthorized",
		})
	}

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Always allow preflight and health checks.
			if r.Method == http.MethodOptions || r.URL.Path == "/api/v1/health" {
				next.ServeHTTP(w, r)
				return
			}

			if expectedToken == "" {
				next.ServeHTTP(w, r)
				return
			}

			raw := r.Header.Get("Authorization")
			if raw == "" {
				writeUnauthorized(w)
				return
			}

			const prefix = "Bearer "
			if !strings.HasPrefix(raw, prefix) {
				writeUnauthorized(w)
				return
			}

			got := strings.TrimSpace(strings.TrimPrefix(raw, prefix))
			if subtle.ConstantTimeCompare([]byte(got), []byte(expectedToken)) != 1 {
				writeUnauthorized(w)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

