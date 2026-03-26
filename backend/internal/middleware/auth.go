package middleware

import (
	"crypto/subtle"
	"net/http"
	"strings"
)

// RequireBearerToken enforces a single shared Bearer token.
//
// If expectedToken is empty, auth is disabled (useful for local dev).
// This is intentionally minimal until the product defines real auth (users/sessions).
func RequireBearerToken(expectedToken string) func(http.Handler) http.Handler {
	expectedToken = strings.TrimSpace(expectedToken)

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
				http.Error(w, "unauthorized", http.StatusUnauthorized)
				return
			}

			const prefix = "Bearer "
			if !strings.HasPrefix(raw, prefix) {
				http.Error(w, "unauthorized", http.StatusUnauthorized)
				return
			}

			got := strings.TrimSpace(strings.TrimPrefix(raw, prefix))
			if subtle.ConstantTimeCompare([]byte(got), []byte(expectedToken)) != 1 {
				http.Error(w, "unauthorized", http.StatusUnauthorized)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

