package service

import "github.com/htahta103/PageForge/backend/internal/repository"

type Service struct {
	repo *repository.Repository
}

func New(repo *repository.Repository) *Service {
	return &Service{repo: repo}
}
