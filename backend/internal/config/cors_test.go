package config

import (
	"os"
	"testing"
)

func TestAllowedOrigins(t *testing.T) {
	t.Cleanup(func() { _ = os.Unsetenv("CORS_ORIGIN") })

	t.Run("default when unset", func(t *testing.T) {
		_ = os.Unsetenv("CORS_ORIGIN")
		got := AllowedOrigins()
		if len(got) != 1 || got[0] != "http://localhost:5173" {
			t.Fatalf("got %v", got)
		}
	})

	t.Run("comma-separated", func(t *testing.T) {
		t.Setenv("CORS_ORIGIN", " https://a.example ,https://b.example ")
		got := AllowedOrigins()
		if len(got) != 2 || got[0] != "https://a.example" || got[1] != "https://b.example" {
			t.Fatalf("got %v", got)
		}
	})
}
