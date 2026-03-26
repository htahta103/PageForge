package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"

	"github.com/htahta103/PageForge/backend/internal/handler"
	"github.com/htahta103/PageForge/backend/internal/middleware"
	"github.com/htahta103/PageForge/backend/internal/repository"
	"github.com/htahta103/PageForge/backend/internal/service"
)

func main() {
	// Logging
	level, err := zerolog.ParseLevel(getEnv("LOG_LEVEL", "info"))
	if err != nil {
		level = zerolog.InfoLevel
	}
	zerolog.SetGlobalLevel(level)
	log.Logger = zerolog.New(os.Stdout).With().Timestamp().Logger()

	// Database
	dbURL := getEnv("DATABASE_URL", "postgres://pageforge:pageforge@localhost:5432/pageforge?sslmode=disable")
	pool, err := pgxpool.New(context.Background(), dbURL)
	if err != nil {
		log.Fatal().Err(err).Msg("failed to connect to database")
	}
	defer pool.Close()

	if err := pool.Ping(context.Background()); err != nil {
		log.Fatal().Err(err).Msg("failed to ping database")
	}
	log.Info().Msg("connected to database")

	// Dependencies
	repo := repository.New(pool)
	svc := service.New(repo)
	h := handler.New(svc)

	// Router
	r := chi.NewRouter()

	// Middleware
	r.Use(chimw.Recoverer)
	r.Use(chimw.RealIP)
	r.Use(middleware.RequestID)
	r.Use(middleware.Logger)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{getEnv("CORS_ORIGIN", "http://localhost:5173")},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-Request-ID"},
		ExposedHeaders:   []string{"X-Request-ID"},
		AllowCredentials: false,
		MaxAge:           300,
	}))

	// Routes
	r.Route("/api/v1", func(r chi.Router) {
		r.Get("/health", h.HealthCheck)

		r.Route("/projects", func(r chi.Router) {
			r.Get("/", h.ListProjects)
			r.Post("/", h.CreateProject)

			r.Route("/{projectId}", func(r chi.Router) {
				r.Get("/", h.GetProject)
				r.Put("/", h.UpdateProject)
				r.Delete("/", h.DeleteProject)

				r.Route("/pages", func(r chi.Router) {
					r.Get("/", h.ListPages)
					r.Post("/", h.CreatePage)

					r.Route("/{pageId}", func(r chi.Router) {
						r.Get("/", h.GetPage)
						r.Put("/", h.UpdatePage)
						r.Delete("/", h.DeletePage)
						r.Post("/duplicate", h.DuplicatePage)

						r.Get("/export", h.ExportPage)
						r.Get("/export/zip", h.ExportPageZip)
					})
				})
			})
		})
	})

	// Server
	port := getEnv("PORT", "8080")
	srv := &http.Server{
		Addr:         fmt.Sprintf(":%s", port),
		Handler:      r,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Graceful shutdown
	done := make(chan os.Signal, 1)
	signal.Notify(done, os.Interrupt, syscall.SIGTERM)

	go func() {
		log.Info().Str("port", port).Msg("starting server")
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatal().Err(err).Msg("server failed")
		}
	}()

	<-done
	log.Info().Msg("shutting down server")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatal().Err(err).Msg("server forced to shutdown")
	}

	log.Info().Msg("server stopped")
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
