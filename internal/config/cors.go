package config

import (
	"os"
	"strings"
)

// AllowedOrigins returns CORS allowed origins from CORS_ORIGIN.
// Use a comma-separated list for multiple frontends, e.g.:
//   CORS_ORIGIN=https://pageforge-staging.pages.dev,http://localhost:5173
func AllowedOrigins() []string {
	raw := os.Getenv("CORS_ORIGIN")
	if raw == "" {
		return []string{"http://localhost:5173"}
	}
	parts := strings.Split(raw, ",")
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		if s := strings.TrimSpace(p); s != "" {
			out = append(out, s)
		}
	}
	if len(out) == 0 {
		return []string{"http://localhost:5173"}
	}
	return out
}
