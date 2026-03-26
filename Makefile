.PHONY: build test lint dev deploy-staging deploy-prod

# ---- Development ----

dev: ## Start all services for local development
	docker compose up --build

dev-backend: ## Start backend with hot reload (requires air)
	cd backend && DATABASE_URL="postgres://pageforge:pageforge@localhost:5432/pageforge?sslmode=disable" go run ./cmd/pageforge

dev-frontend: ## Start frontend dev server
	cd frontend && npm run dev

dev-web: ## (Experimental) Start legacy web/ dev server
	@echo "web/ is experimental and not part of the supported pipeline. Canonical UI is frontend/."
	@echo "If you really meant web/: cd web && npm install && npm run dev"

dev-db: ## Start only PostgreSQL and run migrations
	docker compose up -d postgres migrate

# ---- Build ----

build: build-backend build-frontend ## Build all

build-backend: ## Build Go backend binary
	cd backend && go build -o bin/pageforge ./cmd/pageforge

build-frontend: ## Build frontend for production
	cd frontend && npm ci && npm run build

# ---- Test ----

test: test-backend test-frontend ## Run all tests

test-backend: ## Run backend tests
	cd backend && go test ./...

test-frontend: ## Run frontend tests
	cd frontend && npm run test -- --run

# ---- Lint ----

lint: lint-backend lint-frontend ## Run all linters

lint-backend: ## Lint Go code
	cd backend && golangci-lint run ./...

lint-frontend: ## Lint frontend code
	cd frontend && npm run lint

# ---- Typecheck ----

typecheck: ## Run TypeScript type checking
	cd frontend && npm run typecheck

# ---- Deploy ----

deploy-staging: build ## Deploy to staging
	@echo "TODO: Configure staging deployment"
	@echo "docker compose -f docker-compose.yml -f docker-compose.staging.yml up -d"

deploy-prod: build ## Deploy to production
	@echo "TODO: Configure production deployment"
	@echo "docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d"

# ---- Database ----

migrate-up: ## Run database migrations
	docker compose run --rm migrate

migrate-down: ## Rollback last migration
	docker compose run --rm migrate -path=/migrations \
		-database="postgres://pageforge:pageforge@postgres:5432/pageforge?sslmode=disable" down 1

# ---- Cleanup ----

clean: ## Remove build artifacts
	rm -rf backend/bin frontend/dist

docker-clean: ## Remove all Docker resources
	docker compose down -v --remove-orphans

# ---- Help ----

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

.DEFAULT_GOAL := help
